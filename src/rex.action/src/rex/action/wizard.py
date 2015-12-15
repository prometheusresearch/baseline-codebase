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
    Start, Execute, Repeat, Replace,
    PathVal,
    visit as visit_instruction, map as map_instruction)
from .action import (
    ActionMapVal, ActionRenderer, ActionBase)
from .validate import (
    DomainVal,
    ActionReferenceVal, LocalActionReference, GlobalActionReference)
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
            with self.domain:
                self.actions = self.actions.resolve()
        if isinstance(self.path, Deferred):
            validate_path = PathVal(self._resolve_action)
            self.path = self.path.resolve(validate_path)

    def _resolve_action(self, ref):
        action = resolve_action_reference(
            ref,
            actions=self.actions,
            package=self.package,
            domain=self.domain,
        )
        self.states = self.domain.merge(action.domain)
        return action

    @property
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
            node.action_instance.context_types.input
            for node in input_nodes
            if isinstance(node, Execute)
        ])
        output = typing.intersect_record_types([
            node.action_instance.context_types.output
            for node in output_nodes
            if isinstance(node, Execute)
        ])

        return input, output

    def _typecheck_execute(self, instruction, context_type, path, recurse=True):
        with guard('While parsing:', locate(instruction)):
            action = self._resolve_action(instruction.action)
            if action is None:
                raise Error('Unknown action found:', instruction.action)
            input, output = action.context_types
            try:
                action.typecheck(context_type)
            except typing.KindsDoNotMatch as err:
                error = Error('Unification error:', 'type kinds do not match')
                error.wrap('One type is %s:' % \
                            _type_repr(err.kind_a), err.type_a)
                error.wrap('Another type is %s:' % \
                            _type_repr(err.kind_b), err.type_b)
                error = _wrap_unification_error(
                        error, context_type, path, instruction.action)
                raise error
            except typing.InvalidRowTypeUsage:
                error = Error('Row types are only valid within a record types')
                error = _wrap_unification_error(
                        error, context_type, path, instruction.action)
                raise error
            except typing.UnknownKind as err:
                error = Error('Unification error:', 'unknown kinds')
                error.wrap('One type of kind %s' % \
                            err.kind_a, err.type_a)
                error.wrap('Another type of kind %s' % \
                            err.kind_b, err.type_b)
                error = _wrap_unification_error(
                        error, context_type, path, instruction.action)
                raise error
            except typing.RecordTypeMissingKey as err:
                error = Error(
                    'Action "%s" cannot be used here:' % instruction.action,
                    'Context is missing "%s"' % err.type)
                error = _wrap_unification_error(
                        error, context_type, path, instruction.action)
                raise error
            except typing.RowTypeMismatch as err:
                error = Error(
                    'Action "%s" cannot be used here:' % instruction.action,
                    'Context has "%s" but expected to have "%s"' % (
                        err.type_b, err.type_a))
                error = _wrap_unification_error(
                        error, context_type, path, instruction.action)
                raise error
            except typing.UnificationError as err:
                error = Error('Type unification error:', err)
                error = _wrap_unification_error(
                        error, context_type, path, instruction.action)
                raise error

        next_context_type = typing.RecordType.empty()
        next_context_type.rows.update(context_type.rows)
        next_context_type.rows.update(output.rows)

        if recurse and instruction.then:
            return [
                pair
                for next_instruction in instruction.then
                for pair in self._typecheck(
                    next_instruction, next_context_type, path + [instruction.action])
            ]
        else:
            return [(instruction, next_context_type)]

    def _typecheck_repeat(self, instruction, context_type, path, recurse=True):
        end_types = self._typecheck(
                instruction.repeat, context_type, path + ['<repeat loop>'])
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

    def _typecheck_replace(self, instruction, context_type, path, recurse=True):
        path = path + ['<replace %s>' % instruction.replace]
        self._typecheck(
            instruction.instruction, context_type, path, recurse=False)
        return []

    def _typecheck(self, instruction, context_type, path, recurse=True):
        if isinstance(instruction, Execute):
            return self._typecheck_execute(
                instruction, context_type, path, recurse=recurse)
        elif isinstance(instruction, Replace):
            return self._typecheck_replace(
                instruction, context_type, path, recurse=recurse)
        elif isinstance(instruction, Repeat):
            return self._typecheck_repeat(
                instruction, context_type, path, recurse=recurse)

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


local_action_ref_val = ActionReferenceVal(reference_type=LocalActionReference)


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

    ref = local_action_ref_val(ref)

    if not ref.id in actions:
        raise Error('Found unknown action reference:', ref.id)

    action = actions[ref.id]

    if isinstance(action, GlobalActionReference):
        global_ref = action
        if not global_ref.package:
            if not package:
                raise Error(
                    'Package name is missing, use pkg:path syntax',
                    global_ref)
            handler = route('%s:%s' % (package.name, global_ref.id))
        else:
            handler = route('%s:%s' % (global_ref.package, global_ref.id))

        if handler is None:
            raise Error(
                'Cannot resolve global action reference:',
                global_ref)
        elif not isinstance(handler, ActionRenderer):
            raise Error(
                'Action reference resolves to handler of a non-action type:',
                global_ref)
        else:
            action = handler.action.__clone__(id=ref.id)

        if global_ref.query:
            refine = {name: domain[type] for name, type in global_ref.query.items()}
            action = action.refine_input(refine)

    action = action.with_domain(action.domain.merge(domain))
    return action


class WizardBase(WizardWidgetBase, ActionBase):
    """ Base class for wizards."""

    @property
    def domain(self):
        return self.states or typing.Domain.current()

    def with_domain(self, domain):
        def _map(inst, _ancestors):
            if isinstance(inst, (Start, Replace)):
                return inst
            action_instance = inst.action_instance.with_domain(domain)
            return inst.__clone__(action_instance=action_instance)
        wizard = self.__clone__(__domain=domain)
        wizard.path = map_instruction(wizard.path, _map)
        return wizard

    def refine_input(self, input):
        path = self.path.__clone__(then=[
            inst.__clone__(action_instance=inst.action_instance.refine_input(input))
            for inst in self.path.then
        ])
        return self.__clone__(path=path)


class Wizard(WizardBase):
    """ Wizard which renders the last active action on an entire screen."""

    name = 'wizard'
    js_type = 'rex-action/lib/single-page/Wizard'
