"""

    rex.action.wizard
    =================

    This module provides :class:`Wizard` widget which is used to render and
    orchestrate actions.

    :copyright: 2015, Prometheus Research, LLC

"""



from webob import Response
from webob.exc import HTTPMethodNotAllowed

from rex.core import (
    Error, locate, guard, OneOfVal, RecordVal, AnyVal, MapVal, StrVal, IntVal)
from rex.widget import Widget, Field, responder
from rex.widget.transitionable import as_transitionable
from rex.widget.validate import DeferredVal, Deferred
from rex.widget.util import product_to_pojo
from rex.port import Port

from .action import ActionBase, _format_Action
from .validate import DomainVal, ActionMapVal
from . import typing
from . import instruction

__all__ = ('WizardBase', 'WizardWidgetBase', 'visit_wizards')

validate_entity = RecordVal(('type', StrVal()), ('id', OneOfVal(StrVal(), IntVal())))

validate_context = MapVal(StrVal(), OneOfVal(validate_entity, AnyVal()))

validate_req = MapVal(StrVal(), validate_context)


def is_entity(obj):
    """ Check if ``obj`` is being an entity."""
    return isinstance(obj, validate_entity.record_type)


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
        MapVal(StrVal(), AnyVal()),
        default=None,
        doc="""
        Initial context.
        """)

    states = Field(
        DomainVal('action-scoped'),
        default=None,
        transitionable=False,
        doc="""
        State definitions for entities inside the context.
        """)

    def __init__(self, **values):
        super(WizardWidgetBase, self).__init__(**values)
        self._port_cache = {}
        if isinstance(self.actions, Deferred):
            with self.domain:
                self.actions = self.actions.resolve()
        if isinstance(self.path, Deferred):
            validate_path = instruction.PathVal(self.id, self._resolve_action)
            self.path = self.path.resolve(validate_path)

        self._enrich_domain()

    def _enrich_domain(self):
        def _visit(instruction, domain):
            if hasattr(instruction, 'action_instance'):
                domain = domain.merge(instruction.action_instance.domain)
            return domain

        domain = instruction.visit(self.path, _visit, self.domain)
        self.states = domain
        for k, v in list(self.actions.items()):
            self.actions[k] = v.with_domain(domain)

    def _resolve_action(self, ref):
        action = self.actions[ref]
        if isinstance(action, WizardBase) and not action.included:
            action = action.__validated_clone__()
            action.included = True
            self.actions[ref] = action
        return action

    @responder
    def data(self, req):

        entity_cache = {}

        if not req.method == 'POST':
            raise HTTPMethodNotAllowed()

        def is_entity(v):
            return isinstance(v, validate_entity.record_type)

        def param_def(name):
            return {'parameter': name, 'default': None}

        def refetch(entity, params=None):
            params = params or {}
            params_defs = [
                param_def(name) for name in params
                if not name.lower() == 'user'
            ]
            params_bind = {
                k: v.id if is_entity(v) else v
                for k, v in list(params.items()) if not k.lower() == 'user'
            }

            entity_cache_key = '%s__%s__%s' % (
                entity.type, entity.id, repr(sorted(params_bind.items())), )

            if entity_cache_key in entity_cache:
                return entity_cache[entity_cache_key]

            port_cache_key = '%s__%s' % (entity.type,
                                         repr(sorted(params_bind.keys())), )

            if port_cache_key in self._port_cache:
                port = self._port_cache[port_cache_key]
            else:
                try:
                    port = Port(params_defs + [{
                        'entity': entity.type,
                        'select': []
                    }])
                    port = typing.annotate_port(self.domain, port)
                    self._port_cache[port_cache_key] = port
                # OK, port cannot be created, probably this was a synthetic
                # entity. We should handle this another way but for now we just
                # memoize a null value and return the same data we got.
                # Synthetic entities can't have states so we are ok from the
                # correctness point of view.
                except Error:
                    port = None
                    self._port_cache[port_cache_key] = None

            if port is not None:
                product = port.produce(('*', entity.id), **params_bind)

                data = product_to_pojo(product)[entity.type]
                data = data[0] if data else None

                entity_cache[entity_cache_key] = data

                return data
            else:
                return {'id': entity.id, 'meta:type': entity.type}

        data = validate_req(req.json_body)

        update = {}
        for id, context in list(data.items()):
            next_context = {}
            for k, v in list(context.items()):
                if is_entity(v):
                    next_context[k] = refetch(v, params=context)
                else:
                    next_context[k] = v
            update[id] = next_context
        return Response(json=update)

    @property
    def domain(self):
        return self.states or typing.Domain.current()

    def typecheck(self, context_type=None):
        if context_type is None:
            if self.initial_context:
                context_type = typing.RecordType([
                    typing.RowType(k, typing.anytype)
                    for k in self.initial_context
                ])
            else:
                input, _ = self.context_types
                context_type = input

        for inst in self.path.then:
            trace = [(self.path, context_type)]
            path = []
            self._typecheck(inst, context_type, trace, path)

    def context(self):
        input_nodes = self.path.then
        output_nodes = []

        def _find_output_nodes(inst, _state=None):
            if not inst.then and not isinstance(inst, instruction.Repeat):
                output_nodes.append(inst)

        instruction.visit(self.path, _find_output_nodes)

        input = typing.intersect_record_types([
            node.action_instance.context_types.input for node in input_nodes
            if isinstance(node, instruction.Execute)
        ])
        output = typing.intersect_record_types([
            node.action_instance.context_types.output for node in output_nodes
            if isinstance(node, instruction.Execute)
        ])

        return input, output

    def _typecheck_execute(self, inst, context_type, trace, path,
                           recurse=True):
        with guard('While parsing:', locate(inst)):
            action = self._resolve_action(inst.action)
            if action is None:
                raise Error('Unknown action found:', inst.action)
            _input, output = action.context_types
            try:
                action.typecheck(context_type)
            except typing.KindsDoNotMatch as err:
                error = Error('Unification error:', 'type kinds do not match')
                error.wrap('One type is %s:' % \
                            _type_repr(err.kind_a), err.type_a)
                error.wrap('Another type is %s:' % \
                            _type_repr(err.kind_b), err.type_b)
                error = _wrap_unification_error(error, context_type, path,
                                                inst.action)
                raise error
            except typing.InvalidRowTypeUsage:
                error = Error('Row types are only valid within a record types')
                error = _wrap_unification_error(error, context_type, path,
                                                inst.action)
                raise error
            except typing.UnknownKind as err:
                error = Error('Unification error:', 'unknown kinds')
                error.wrap('One type of kind %s' % \
                            err.kind_a, err.type_a)
                error.wrap('Another type of kind %s' % \
                            err.kind_b, err.type_b)
                error = _wrap_unification_error(error, context_type, path,
                                                inst.action)
                raise error
            except typing.RecordTypeMissingKey as err:
                error = Error('Action "%s" cannot be used here:' % inst.action,
                              'Context is missing "%s"' % err.type)
                error = _wrap_unification_error(error, context_type, path,
                                                inst.action)
                raise error
            except typing.RowTypeMismatch as err:
                error = Error('Action "%s" cannot be used here:' % inst.action,
                              'Context has "%s" but expected to have "%s"' %
                              (err.type_b, err.type_a))
                error = _wrap_unification_error(error, context_type, path,
                                                inst.action)
                raise error
            except typing.UnificationError as err:
                error = Error('Type unification error:', err)
                error = _wrap_unification_error(error, context_type, path,
                                                inst.action)
                raise error

        next_context_type = typing.RecordType.empty()
        next_context_type.rows.update(context_type.rows)
        next_context_type.rows.update(output.rows)

        if recurse and inst.then:
            return [
                pair
                for next_instruction in inst.then for pair in self._typecheck(
                    next_instruction, next_context_type,
                    trace + [(inst, next_context_type)], path + [inst.action])
            ]
        else:
            return [(inst, next_context_type)]

    def _typecheck_repeat(self, inst, context_type, trace, path, recurse=True):
        end_types = [
            pair
            for repeat_inst in inst.repeat for pair in self._typecheck(
                repeat_inst, context_type, trace, path + ['<repeat loop>'])
        ]

        actions = [self._resolve_action(item.action) for item in inst.repeat]
        if None in actions:
            raise Error('Unknown action found', inst.repeat)

        repeat_invariant = typing.intersect_record_types([
            action.context_types.input
            for action, repeat_inst in zip(actions, inst.repeat)
            if isinstance(repeat_inst, instruction.Execute)
        ])
        next_context_type = typing.RecordType.empty()
        next_context_type.rows.update(context_type.rows)
        next_context_type.rows.update(repeat_invariant.rows)

        for end_instruction, end_type in end_types:
            with guard('While parsing:', locate(end_instruction)):
                try:
                    typing.unify(next_context_type, end_type)
                except typing.RecordTypeMissingKey as err:
                    error = Error(
                        'Repeat ends with a type which is incompatible with its beginning:',
                        'Missing "%s"' % err.type)
                    raise error
                except typing.RowTypeMismatch as err:
                    error = Error(
                        'Repeat ends with a type which is incompatible with its beginning:',
                        'Has "%s" but expected to have "%s"' % (err.type_b,
                                                                err.type_a))
                    raise error
                except typing.UnificationError as err:
                    error = Error('Type unification error:', err)
                    error = _wrap_unification_error(error, context_type, path,
                                                    inst.action)
                    raise error

        if inst.then:
            return [
                pair
                for next_instruction in inst.then for pair in self._typecheck(
                    next_instruction, next_context_type, trace,
                    path + ['<repeat then>'])
            ]
        else:
            return [(inst, next_context_type)]

    def _typecheck_replace(self,
                           inst,
                           orig_context_type,
                           trace,
                           path,
                           recurse=True):
        path = path + ['<replace %s>' % inst.replace]
        next_trace = trace[:]
        # process traverse_back
        if inst.traverse_back > 0:
            next_trace = next_trace[:-inst.traverse_back]
        assert next_trace
        (current_instruction, context_type) = next_trace[-1]
        # process traverse
        for (action_name, context_update) in inst.traverse:
            for next_instruction in current_instruction.then:
                if not isinstance(next_instruction, instruction.Execute):
                    continue
                if next_instruction.action == action_name:
                    if context_update is not None:
                        context_type = update_context_with_spec(
                            context_type, context_update, orig_context_type)
                    else:
                        context_type = orig_context_type
                    self._typecheck(
                        next_instruction,
                        context_type,
                        trace,
                        path,
                        recurse=False)
                    path = path + [next_instruction.action]
                    trace = trace + [(next_instruction, context_type)]
                    current_instruction = next_instruction
                    break
        return []

    def _typecheck(self, inst, context_type, trace, path, recurse=True):
        if isinstance(inst, instruction.Execute):
            return self._typecheck_execute(
                inst, context_type, trace, path, recurse=recurse)
        elif isinstance(inst, instruction.Replace):
            return self._typecheck_replace(
                inst, context_type, trace, path, recurse=recurse)
        elif isinstance(inst, instruction.Repeat):
            return self._typecheck_repeat(
                inst, context_type, trace, path, recurse=recurse)
        elif isinstance(inst, instruction.Start):
            return [
                pair
                for item in inst.then
                for pair in self._typecheck(item, context_type, trace, path)
            ]


def _wrap_unification_error(error, context_type, path, action):
    if not context_type.rows:
        context_repr = '<empty context>'
    else:
        context_repr = sorted(context_type.rows.items())
        context_repr = ['%s: %s' % (k, v.type.key) for k, v in context_repr]
        context_repr = '\n'.join(context_repr)
    error.wrap('Context:', context_repr)
    error.wrap('While type checking action at path:',
               ' -> '.join(path + [action]))
    return error


def _type_repr(kind):
    if hasattr(kind, 'type_name') and kind.type_name is not NotImplemented:
        return kind.type_name
    else:
        return repr(kind)


class WizardBase(WizardWidgetBase, ActionBase):
    """ Base class for wizards."""

    def __init__(self, *args, **kwargs):
        super(WizardBase, self).__init__(*args, **kwargs)
        self.included = False

    class Configuration(ActionBase.Configuration):
        def _apply_override(self, wizard, override):
            if isinstance(override, Deferred):
                override = override.resolve(
                    ActionMapVal(action_map=wizard.actions))
            actions = dict(wizard.actions)
            domain = wizard.domain
            for k, v in list(override.items()):
                if not k in actions:
                    raise Error('Unknown action override:', k)
                if isinstance(v, ActionBase):
                    actions[k] = v
                else:
                    for v in v:
                        actions[k] = v(actions[k])
                domain = domain.merge(actions[k].domain)
            for k, v in list(actions.items()):
                actions[k] = v.with_domain(domain)
            path = instruction.override(wizard.path, actions)
            next_wizard = wizard.derive(path=path, actions=actions)
            next_wizard = next_wizard.with_domain(domain)
            return next_wizard

    @property
    def domain(self):
        return self.states or typing.Domain.current()

    def with_domain(self, domain):
        actions = {
            ref: action.with_domain(domain)
            for ref, action in list(self.actions.items())
        }
        wizard = self.__validated_clone__(__domain=domain, actions=actions)
        return wizard


class Wizard(WizardBase):
    """ Wizard which renders the last active action on an entire screen."""

    name = 'wizard'
    js_type = 'rex-action', 'Wizard'


def update_context_with_spec(context_type, spec, orig_context_type):
    context_type = typing.RecordType(list(context_type.rows.values()))
    for k, v in list(spec.items()):
        if v.startswith('$'):
            orig_k = v[1:]
            row = orig_context_type.rows[orig_k]
            context_type.rows[k] = typing.RowType(k, row.type)
        else:
            # TODO: decide what to do here... any is weak
            context_type.rows[k] = typing.RowType(k, typing.AnyType())
    return context_type


def visit_wizards(wizard, visitor, path=None):
    path = path or ()
    visitor(wizard, path)
    for key, action in list(wizard.actions.items()):
        if isinstance(action, WizardBase):
            visit_wizards(action, visitor, path=path + (key,))
