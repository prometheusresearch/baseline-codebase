"""

    rex.action.action
    =================

    This module provides :class:`Action` class which is used to describe actions
    within an application.

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple, OrderedDict

import yaml
from cached_property import cached_property

from rex.core import (
    Location, Error, Validate, autoreload, get_packages, RecordVal,
    MaybeVal, StrVal, IntVal, SeqVal, MapVal, OMapVal, OneOfVal, AnyVal,
    cached, guard)
from rex.widget import (
    Widget, WidgetVal, Field,
    undefined, as_transitionable, TransitionableRecord)
from rex.widget.widget import _format_Widget
from rex.widget.util import add_mapping_key, pop_mapping_key
from rex.widget.validate import DeferredVal, Deferred

from . import typing
from . import introspection

__all__ = ('ActionBase', 'Action', 'ActionVal')


class ActionMeta(Widget.__metaclass__):

    def __new__(mcs, name, bases, attrs):
        if 'name' in attrs:
            attrs['name'] = _action_sig(attrs['name'])
        cls = Widget.__metaclass__.__new__(mcs, name, bases, attrs)
        return cls


class _action_sig(namedtuple('Action', ['name'])):

    def __hash__(self):
        return hash((self.__class__.__name__, self.name))


class ContextTypes(TransitionableRecord):
    __transit_tag__ = 'map'

    fields = ('input', 'output')


class ActionBase(Widget):

    __metaclass__ = ActionMeta

    #: Action introspection interface
    Introspection = introspection.ActionIntrospection

    id = Field(
        StrVal(),
        doc="""
        Action identifier.

        It is used to refer to actions from within wizards. Action identifier
        should be unique across an entire application.
        """)

    icon = Field(
        StrVal(), default=undefined,
        doc="""
        Action icon.
        """)

    title = Field(
        StrVal(), default=undefined,
        doc="""
        Action title.
        """)

    doc = Field(
        StrVal(), default=undefined,
        transitionable=False,
        doc="""
        Action doc string.

        It is not available in the browser.
        """)

    width = Field(
        IntVal(), default=undefined,
        doc="""
        Action width.
        """)

    def __init__(self, **values):
        self.source_location = None
        self._domain = values.pop('__domain', typing.Domain.current())
        self._context_types = values.pop('__context_types', None)
        self._introspection = None
        super(ActionBase, self).__init__(**values)

    @property
    def domain(self):
        return self._domain

    def _clone_values(self, values):
        next_values = {}
        next_values.update({
            k: v
            for k, v in self.values.items()
            if k not in ('__domain', '__context_types') or k in self._fields})
        next_values.update(values)
        if 'package' not in next_values:
            next_values.update({'package': self.package})
        if '__domain' not in next_values:
            next_values.update({'__domain': self.domain})
        if '__context_types' not in next_values:
            next_values.update({'__context_types': self.context_types})
        return next_values

    def __clone__(self, **values):
        action = self.__class__(**self._clone_values(values))
        if self._introspection:
            action._introspection = self._introspection.transfer(action)
        return action

    def __validated_clone__(self, **values):
        action = self.validated(**self._clone_values(values))
        if self._introspection:
            action._introspection = self._introspection.transfer(action)
        return action

    def with_domain(self, domain):
        """ Override typing domain."""
        return self.__validated_clone__(__domain=domain)

    def refine_input(self, input):
        input = self.context_types.input.refine(input)
        context_types = self.context_types.__clone__(input=input)
        return self.__validated_clone__(__context_types=context_types)

    @cached_property
    def context_types(self):
        if self._context_types:
            return self._context_types
        input, output = self.context()
        if isinstance(input, dict):
            input = self.domain.record(**input)
        if isinstance(output, dict):
            output = self.domain.record(**output)
        if not isinstance(input, typing.Type):
            raise Error(
                'Action "%s" of type "%s" specified incorrect input type:'\
                % (self.id, self.name.name), input)
        if not isinstance(output, typing.Type):
            raise Error(
                'Action "%s" of type "%s" specified incorrect output type:'\
                % (self.id, self.name.name), output)
        return ContextTypes(input, output)

    def context(self):
        """ Compute context specification for an action.

        Should return a pair of context inputs and conext outputs.

        By default it just returns values of ``input`` and ``output`` fields but
        subclasses could override this to provide automatically inferred context
        specification.
        """
        raise NotImplementedError('%s.context()' % self.__class__.__name__)

    def typecheck(self, context_type=None):
        raise NotImplementedError('%s.typecheck()' % self.__class__.__name__)

    @classmethod
    def parse(cls, value):
        validate = ActionVal(action_class=cls)
        if isinstance(value, basestring) or hasattr(value, 'read'):
            return validate.parse(value)
        else:
            raise Error('Cannot parse an action from:', repr(value))


class Action(ActionBase):

    class Configuration(ActionBase.Configuration):

        _no_override_sentinel = object()

        @cached_property
        def _override_validator(self):
            fields = [
                (field.name, field.validate, self._no_override_sentinel)
                for field in self.fields.values()
                if field.name not in ('id',)
            ]
            return RecordVal(fields)

        def _apply_override(self, action, override):
            if isinstance(override, basestring):
                override = self._override_validator.parse(override)
            elif isinstance(override, Deferred):
                override = override.resolve(self._override_validator)
            else:
                override = self._override_validator(override)
            override = {k: v for k, v in override._asdict().items()
                        if v is not self._no_override_sentinel}
            return self.override(action, override)

        def override(self, action, override):
            return action.__validated_clone__(**override)

    def typecheck(self, context_type=None):
        if context_type is None:
            context_type = self.context_types.input
        typing.unify(self.context_types.input, context_type)


@as_transitionable(ActionBase, tag='widget')
def _format_Action(action, req, path): # pylint: disable=invalid-name
    js_type, props = _format_Widget(action, req, path)
    props['context_types'] = {
        'input': action.context_types[0],
        'output': action.context_types[1],
    }
    return js_type, props


class ActionVal(Validate):
    """ Validator for actions."""

    _validate_pre = MapVal(StrVal(), AnyVal())
    _validate_type = StrVal()
    _validate_id = StrVal()

    def __init__(self, action_class=Action, package=None, id=None):
        self.action_class = action_class
        self.package = package
        self.id = id

    def construct(self, loader, node):
        if not isinstance(node, yaml.MappingNode):
            value = super(ActionVal, self).construct(loader, node)
            return self(value)

        with guard("While parsing:", Location.from_node(node)):
            type_node, node = pop_mapping_key(node, 'type')
            if self.action_class is not Action:
                action_class = self.action_class
            elif not type_node:
                raise Error('no action "type" specified')
            else:
                with guard("While parsing:", Location.from_node(type_node)):
                    action_type = self._validate_type.construct(loader, type_node)
                    action_sig = _action_sig(action_type)
                    if action_sig not in ActionBase.mapped():
                        raise Error('unknown action type specified:', action_type)
                action_class = ActionBase.mapped()[action_sig]

            if self.id is not None:
                id_node, node = pop_mapping_key(node, 'id')
                if id_node:
                    error = Error('action "id" is cannot be specified')
                    error.wrap("While parsing:", Location.from_node(id_node))
                    raise error
                node = add_mapping_key(node, 'id', self.id)

        construct = WidgetVal(package=self.package, widget_class=action_class).construct
        return construct(loader, node)

    def __call__(self, value):
        if isinstance(value, self.action_class):
            return value
        value = dict(self._validate_pre(value))
        action_type = value.pop('type', NotImplemented)
        if action_type is NotImplemented:
            raise Error('no action "type" specified')
        action_type = self._validate_type(action_type)
        action_sig = _action_sig(action_type)
        if action_sig not in ActionBase.mapped():
            raise Error('unknown action type specified:', action_type)
        if self.id is not None:
            if 'id' in value:
                raise Error('action "id" is cannot be specified')
            value['id'] = self.id
        action_class = ActionBase.mapped()[action_sig]
        if not issubclass(action_class, self.action_class):
            raise Error('action must be an instance of:', self.action_class)
        value = {k: v for (k, v) in value.items() if k != 'type'}
        validate = WidgetVal(package=self.package, widget_class=action_class).validate_values
        value = validate(action_class, value)
        value['package'] = self.package
        return action_class._configuration(action_class, value)


def override(action, values):
    return action._configuration._apply_override(action, values)
