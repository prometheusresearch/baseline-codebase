"""

    rex.action.wizard
    =================

    This module provides :class:`Wizard` widget which is used to render and
    orchestrate actions.

    :copyright: 2015, Prometheus Research, LLC

"""

import urlparse
import cgi

from cached_property import cached_property

from rex.core import (
    Record,
    Validate, Error, get_settings, locate, guard,
    AnyVal, StrVal, MapVal, SeqVal, StrVal, RecordVal, ChoiceVal)
from rex.widget import Widget, Field
from rex.widget.validate import DeferredVal, Deferred
from rex.web import route

from .instruction import (
    Start, Execute, Repeat,
    PathVal,
    visit as visit_instruction, map as map_instruction)
from .action import (
    ActionVal, ActionMapVal, ActionRenderer, ActionBase)
from .validate import (
    DomainVal,
    ActionReference, LocalActionReference, GlobalActionReference)
from . import typing

__all__ = ('Wizard', 'WizardBase', 'WizardWidgetBase')


class WizardWidgetBase(Widget):
    """ Base class for widgets which render wizards."""

    path = Field(
        DeferredVal(),
        doc="""
        Wizard path specified as a tree of possible transitions between actions.
        """)

    actions = Field(
        DeferredVal(ActionMapVal()),
        default={},
        transitionable=False,
        doc="""
        Wizard actions.
        """)

    initial_context = Field(
        MapVal(StrVal(), AnyVal()), default=None,
        doc="""
        Initial context.
        """)

    states = Field(
        DomainVal('action-scoped'), default=None,
        transitionable=False,
        doc="""
        State definitions for entities inside the context.
        """)

    def __init__(self, **values):
        super(WizardWidgetBase, self).__init__(**values)
        if isinstance(self.actions, Deferred):
            with self.domain or typing.Domain.current():
                self.actions = self.actions.resolve()
        if isinstance(self.path, Deferred):
            validate_path = PathVal(self._resolve_action)
            self.path = self.path.resolve(validate_path)

    def _resolve_action(self, ref):
        return resolve_action_reference(
            ref,
            actions=self.actions,
            package=self.package,
            domain=self.domain,
        )

    @cached_property
    def domain(self):
        return self.states or typing.Domain.current()

    def typecheck(self, context_type=None):
        if context_type is None:
            if self.initial_context:
                context_type = typing.RecordType([
                    typing.RowType(k, typing.anytype)
                    for k in self.initial_context])
            else:
                input, _ = self.context_types
                context_type = input

        for instruction in self.path.then:
            self._typecheck(instruction, context_type, [])

    def context(self):
        input_nodes = self.path.then
        output_nodes = []

        def _find_output_nodes(instruction):
            if not instruction.then and not isinstance(instruction, Repeat):
                output_nodes.append(instruction)

        visit_instruction(self.path, _find_output_nodes)

        input = typing.intersect_record_types([
            node.action_instance.context_types.input for node in input_nodes])
        output = typing.intersect_record_types([
            node.action_instance.context_types.output for node in output_nodes])

        return input, output

    def _typecheck(self, instruction, context_type, path):
        if isinstance(instruction, Execute):
            with guard('While parsing:', locate(instruction)):
                action = self._resolve_action(instruction.action)
                if action is None:
                    raise Error('Unknown action found:', instruction.action)
                input, output = action.context_types
                assert isinstance(input, typing.Type), 'Expected a type, got: %s' % input
                assert isinstance(output, typing.Type), 'Expected a type, got: %s' % output
                try:
                    action.typecheck(context_type)
                except typing.KindsDoNotMatch as err:
                    error = Error('Unification error:', 'type kinds do not match')
                    error.wrap('One type is %s:' % _type_repr(err.kind_a), err.type_a)
                    error.wrap('Another type is %s:' % _type_repr(err.kind_b), err.type_b)
                    error = _wrap_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.InvalidRowTypeUsage:
                    error = Error('Row types are only valid within a record types')
                    error = _wrap_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.UnknownKind as err:
                    error = Error('Unification error:', 'unknown kinds')
                    error.wrap('One type of kind %s' % err.kind_a, err.type_a)
                    error.wrap('Another type of kind %s' % err.kind_b, err.type_b)
                    error = _wrap_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.RecordTypeMissingKey as err:
                    error = Error(
                        'Action "%s" cannot be used here:' % instruction.action,
                        'Context is missing "%s"' % err.type)
                    error = _wrap_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.RowTypeMismatch as err:
                    error = Error(
                        'Action "%s" cannot be used here:' % instruction.action,
                        'Context has "%s" but expected to have "%s"' % (
                            err.type_b, err.type_a))
                    error = _wrap_unification_error(error, context_type, path, instruction.action)
                    raise error
                except typing.UnificationError as err:
                    error = Error('Type unification error:', err)
                    error = _wrap_unification_error(error, context_type, path, instruction.action)
                    raise error

            next_context_type = typing.RecordType.empty()
            next_context_type.rows.update(context_type.rows)
            next_context_type.rows.update(output.rows)

            if instruction.then:
                return [
                    pair
                    for next_instruction in instruction.then
                    for pair in self._typecheck(next_instruction, next_context_type, path + [instruction.action])
                ]
            else:
                return [(instruction, next_context_type)]

        elif isinstance(instruction, Repeat):
            end_types = self._typecheck(instruction.repeat, context_type, path + ['<repeat loop>'])
            action = self._resolve_action(instruction.repeat.action)
            if action is None:
                raise Error('Unknown action found:', instruction.repeat.action)
            repeat_invariant, _ = action.context_types
            for end_instruction, end_type in end_types:
                with guard('While parsing:', locate(end_instruction)):
                    try:
                        typing.unify(repeat_invariant, end_type)
                    except typing.RecordTypeMissingKey as err:
                        error = Error(
                            'Repeat ends with a type which is incompatible with its beginning:',
                            'Missing "%s"' % err.type)
                        raise error
                    except typing.RowTypeMismatch as err:
                        error = Error(
                            'Repeat ends with a type which is incompatible with its beginning:',
                            'Has "%s" but expected to have "%s"' % (
                                err.type_b, err.type_a))
                        raise error
                    except typing.UnificationError as err:
                        error = Error('Type unification error:', err)
                        error = _wrap_unification_error(error, context_type, path, instruction.action)
                        raise error

            if instruction.then:
                return [
                    self._typecheck(next_instruction, repeat_invariant, path + ['<repeat then>'])
                    for next_instruction in instruction.then
                ]
            else:
                return instruction, repeat_invariant


def _wrap_unification_error(error, context_type, path, action):
    if not context_type.rows:
        context_repr = '<empty context>'
    else:
        context_repr = sorted(context_type.rows.items())
        context_repr = ['%s: %s' % (k, v.type.key) for k, v in context_repr]
        context_repr = '\n'.join(context_repr)
    error.wrap('Context:', context_repr)
    error.wrap('While type checking action at path:', ' -> '.join(path + [action]))
    return error


def _type_repr(kind):
    if hasattr(kind, 'type_name') and kind.type_name is not NotImplemented:
        return kind.type_name
    else:
        return repr(kind)


def resolve_action_reference(ref, actions=None, package=None, domain=None):
    """ Resolve action reference to action instance.

    :param ref: Action reference
    :keyword actions: Local actions bindings
    :keyword package: Current package
    :keyword domain: Current domain
    :returns: Action instance for a reference
    """
    action = None

    actions = actions or {}
    domain = domain or typing.Domain.current()

    ref = ActionReference.validate(ref)

    if isinstance(ref, LocalActionReference):
        if not actions:
            raise Error('Local actions are not allowed in this configuration')
        if not ref.id in actions:
            raise Error('Found unknown local action reference:', ref.id)
        action = actions[ref.id]

    elif isinstance(ref, GlobalActionReference):
        if not ref.package:
            if not package:
                raise Error(
                    'Package name is missing, use pkg:path syntax',
                    ref)
            handler = route('%s:%s' % (package.name, ref.id))
        else:
            handler = route('%s:%s' % (ref.package, ref.id))

        if handler is None:
            raise Error(
                'Cannot resolve global action reference:',
                ref)
        elif not isinstance(handler, ActionRenderer):
            raise Error(
                'Action reference resolves to handler of a non-action type:',
                ref)
        else:
            action = handler.action

    if action is None:
        raise Error('Cannot resolve action reference:', ref)

    if ref.query:
        rows = {name: domain[type] for name, type in ref.query.items()}
        input = action.context_types.input.override(rows)
        context_types = action.context_types.__clone__(input=input)
        action = action.with_context_types(context_types)

    action = action.with_domain(action.domain.merge(domain))
    return action


class WizardBase(WizardWidgetBase, ActionBase):
    """ Base class for wizards."""

    @cached_property
    def domain(self):
        return self.states or typing.Domain.current()

    def with_domain(self, domain):
        def _map(inst):
            if isinstance(inst, Start):
                return inst
            action_instance = inst.action_instance.with_domain(domain)
            return inst.__clone__(action_instance=action_instance)
        wizard = self.__clone__(__domain=domain)
        wizard.path = map_instruction(wizard.path, _map)
        return wizard


class Wizard(WizardBase):
    """ Wizard which renders the last active action on an entire screen."""

    name = 'wizard'
    js_type = 'rex-action/lib/single-page/Wizard'
