"""

    rex.action.action
    =================

    This module provides :class:`Action` class which is used to describe actions
    within an application.

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple, OrderedDict

import yaml

from rex.core import (
    Location, Error, Validate, autoreload, get_packages,
    cached, guard)
from rex.core import MaybeVal, StrVal, IntVal, SeqVal, MapVal, OMapVal, AnyVal
from rex.widget import Widget, WidgetVal, Field, undefined
from rex.widget.validate import DeferredVal
from rex.widget.util import add_mapping_key, pop_mapping_key

__all__ = ('Action', 'ActionVal', 'ActionMapVal')


class ActionMeta(Widget.__metaclass__):

    def __new__(mcs, name, bases, attrs):
        if 'name' in attrs:
            attrs['name'] = _action_sig(attrs['name'])
        cls = Widget.__metaclass__.__new__(mcs, name, bases, attrs)
        return cls


class _action_sig(namedtuple('Action', ['name'])):

    def __hash__(self):
        return hash((self.__class__.__name__, self.name))


class Action(Widget):
    """ Base class for actions.

    Action is a reusable piece of UI which can be composed with other actions
    into a wizard.

    To define a new action type one should subclass :class:`Action` and provide
    action type name, JavaScript module which contains implementation and a
    configuration interface::

        from rex.core import StrVal
        from rex.widget import Field
        from rex.action import Action

        class PickDate(Action):

            name = 'pick-date'
            js_type = 'my-package/lib/pick-date'

            entity = Field(
                StrVal(),
                doc='''
                Name of the entity to show, should contain a ``date`` column of
                type ``datetime``.
                ''')

    Then actions of this type could be declared in (``action.yaml``)::

        - type: pick-date
          id: pick-appointment
          entity: appointment

    """

    __metaclass__ = ActionMeta

    id = Field(
        StrVal(),
        doc="""
        Action identifier.

        It is used to refer to actions from within wizards. Action identifier
        should be unique across an entire application.
        """)

    title = Field(
        StrVal(), default=undefined,
        doc="""
        Action title.
        """)

    icon = Field(
        StrVal(), default=undefined,
        doc="""
        Action icon.
        """)

    width = Field(
        IntVal(), default=undefined,
        doc="""
        Action width.
        """)

    def __init__(self, **values):
        super(Action, self).__init__(**values)
        input, output = self.context()
        self.values['context_spec'] = {'input': input, 'output': output}

    def context(self):
        """ Compute context specification for an action.

        Should return a pair of context inputs and conext outputs.

        By default it just returns values of ``input`` and ``output`` fields but
        subclasses could override this to provide automatically inferred context
        specification.
        """
        raise NotImplementedError('%s.context()' % self.__class__.__name__)

    @classmethod
    def parse(cls, value):
        validate = ActionVal(action_class=cls)
        if isinstance(value, basestring) or hasattr(value, 'read'):
            return validate.parse(value)
        else:
            return validate(value)


class ActionVal(Validate):
    """ Validator for actions."""

    _validate_pre = MapVal(StrVal(), AnyVal())
    _validate_type = StrVal()
    _validate_id = StrVal()

    def __init__(self, action_class=Action, id=None):
        self.action_class = action_class
        self.id = id

    def construct(self, loader, node):
        if not isinstance(node, yaml.MappingNode):
            value = super(ActionVal, self).construct(loader, node)
            return self(value)

        with guard("While parsing:", Location.from_node(node)):
            type_node, node = pop_mapping_key(node, 'type')
            if not type_node:
                raise Error('no action "type" specified')

            with guard("While parsing:", Location.from_node(type_node)):
                action_type = self._validate_type.construct(loader, type_node)
                action_sig = _action_sig(action_type)
                if action_sig not in Action.mapped():
                    raise Error('unknown action type specified:', action_type)

            if self.id is not None:
                id_node, node = pop_mapping_key(node, 'id')
                if id_node:
                    error = Error('action "id" is cannot be specified')
                    error.wrap("While parsing:", Location.from_node(id_node))
                    raise error
                node = add_mapping_key(node, 'id', self.id)

        action_class = Action.mapped()[action_sig]

        construct = WidgetVal(widget_class=action_class).construct
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
        if action_sig not in Action.mapped():
            raise Error('unknown action type specified:', action_type)
        if self.id is not None:
            if 'id' in value:
                raise Error('action "id" is cannot be specified')
            value['id'] = self.id
        action_class = Action.mapped()[action_sig]
        if not issubclass(action_class, self.action_class):
            raise Error('action must be an instance of:', self.action_class)
        value = {k: v for (k, v) in value.items() if k != 'type'}
        return action_class(**value)


class ActionMapVal(Validate):
    """ Validator for a mapping from action ids to actions."""

    _validate_pre = MapVal(StrVal(), DeferredVal(validate=AnyVal()))
    _validate_id = StrVal()

    def construct(self, loader, node):
        mapping = self._validate_pre.construct(loader, node)
        return {k: v.resolve(validate=ActionVal(id=k))
                for k, v in mapping.items()}

    def __call__(self, value):
        mapping = self._validate_pre(value)
        return {k: v.resolve(validate=ActionVal(id=k))
                for k, v in mapping.items()}
