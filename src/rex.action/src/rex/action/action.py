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

__all__ = ('Action', 'ActionVal', 'load_actions')


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
    def validate(cls, value):
        validate = ActionVal(action_class=cls)
        if isinstance(value, basestring) or hasattr(value, 'read'):
            return validate.parse(value)
        else:
            return validate(value)


class ActionVal(Validate):
    """ Validator for actions."""

    _validate_pre = MapVal(StrVal(), AnyVal())
    _validate_type = StrVal()

    def __init__(self, action_class=Action):
        self.action_class = action_class

    def construct(self, loader, node):
        if not isinstance(node, yaml.MappingNode):
            value = super(ActionVal, self).construct(loader, node)
            return self(value)

        with guard("While parsing:", Location.from_node(node)):
            type_node, node = pop_mapping_key(node, 'type')
            if not type_node:
                print node, type_node
                return
                raise Error('no action "type" specified')

        with guard("While parsing:", Location.from_node(type_node)):
            action_type = self._validate_type.construct(loader, type_node)
            action_sig = _action_sig(action_type)
            if action_sig not in Action.mapped():
                raise Error('unknown action type specified:', action_type)

        action_class = Action.mapped()[action_sig]

        construct = WidgetVal(widget_class=action_class).construct
        return construct(loader, node)

    def __call__(self, value):
        if isinstance(value, self.action_class):
            return value
        value = self._validate_pre(value)
        action_type = value.pop('type', NotImplemented)
        if action_type is NotImplemented:
            raise Error('no action "type" specified')
        action_type = self._validate_type(action_type)
        action_sig = _action_sig(action_type)
        if action_sig not in Action.mapped():
            raise Error('unknown action type specified:', action_type)
        action_class = Action.mapped()[action_sig]
        if not issubclass(action_class, self.action_class):
            raise Error('action must be an instance of:', self.action_class)
        value = {k: v for (k, v) in value.items() if k != 'type'}
        return action_class(**value)


YAML_STR_TAG = u'tag:yaml.org,2002:str'

def pop_mapping_key(node, key):
    assert isinstance(node, yaml.MappingNode)
    value = []
    for n, (k, v) in enumerate(node.value):
        if isinstance(k, yaml.ScalarNode) and k.tag == YAML_STR_TAG and k.value == key:
            node = yaml.MappingNode(
                node.tag,
                node.value[:n] + node.value[n + 1:],
                start_mark=node.start_mark,
                end_mark=node.end_mark,
                flow_style=node.flow_style)
            return v, node
    return None, node


def load_actions(filename='action.yaml'):
    """ Load all defined actions within the currently active app."""
    return OrderedDict((a.id, a) for a in _load_actions(filename))


def _load_actions(filename):
    return [a for p in get_packages()
              for a in _load_actions_from(p, filename)]


@autoreload
def _load_actions_from(package, filename, open=open):
    if not package.exists(filename):
        return []
    with open(package.abspath(filename)) as f:
        return SeqVal(ActionVal()).parse(f)
