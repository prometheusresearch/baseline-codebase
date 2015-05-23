"""

    rex.workflow.action
    ===================

    This module provides :class:`Action` class which is used to describe actions
    within an application.

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple

from rex.core import Error, Validate, autoreload, get_packages, cached
from rex.core import MaybeVal, StrVal, SeqVal, MapVal, AnyVal
from rex.widget import Widget, Field, MaybeUndefinedVal, undefined

__all__ = ('Action', 'ActionVal', 'load_actions')


class ActionMeta(Widget.__metaclass__):

    def __new__(mcs, name, bases, attrs):
        if 'name' in attrs:
            attrs['name'] = _action_sig(attrs['name'])
        cls = Widget.__metaclass__.__new__(mcs, name, bases, attrs)
        return cls


_action_sig = namedtuple('Action', ['name'])


class Action(Widget):
    """ Base class for actions.

    Action is a reusable piece of UI which can be composed with other actions
    into a workflow.

    To define a new action type one should subclass :class:`Action` and provide
    action type name, JavaScript module which contains implementation and a
    configuration interface::

        from rex.core import StrVal
        from rex.widget import Field
        from rex.workflow import Action

        class PickDate(Action):

            name = 'pick-date'
            js_type = 'my-package/lib/pick-date'

            entity = Field(
                StrVal(),
                doc='''
                Name of the entity to show, should contain a ``date`` column of
                type ``datetime``.
                ''')

    Then actions of this type could be declared in (``actions.yaml``)::

        - type: pick-date
          id: pick-appointment
          entity: appointment

    """

    __metaclass__ = ActionMeta

    id = Field(
        StrVal(),
        doc="""
        Action identifier.

        It is used to refer to actions from within workflows. Action identifier
        should be unique across an entire application.
        """)

    title = Field(
        MaybeUndefinedVal(StrVal()), default=undefined,
        doc="""
        Action title.
        """)

    icon = Field(
        MaybeUndefinedVal(StrVal()), default=undefined,
        doc="""
        Action icon.
        """)

    input = Field(
        MapVal(StrVal(), StrVal()), default={},
        doc="""
        Context requirements.

        It specifies a set of keys and their types which should be present in
        context for an action to be available.

        For example::

            - id: make-family
              type: ...
              inputs:
                mother: individual
                father: individual

        Specifies that action ``make-family`` is only available when context has
        keys ``mother`` and ``father`` of type ``individual``.
        """)

    output = Field(
        MapVal(StrVal(), StrVal()), default={},
        doc="""
        Specification on context output.
        """)

    def __init__(self, **values):
        super(Action, self).__init__(**values)
        input, output = self.context()
        self.values['input'] = input
        self.values['output'] = output

    def context(self):
        """ Compute context specification for an action.

        Should return a pair of context inputs and conext outputs.

        By default it just returns values of ``input`` and ``output`` fields but
        subclasses could override this to provide automatically inferred context
        specification.
        """
        return self.input, self.output

    @classmethod
    def validate(cls, value):
        validate = ActionVal(action_cls=cls)
        if isinstance(value, basestring) or hasattr(value, 'read'):
            return validate.parse(value)
        else:
            return validate(value)


class ActionVal(Validate):
    """ Validator for actions."""

    _validate_pre = MapVal(StrVal(), AnyVal())

    def __init__(self, action_cls=Action):
        self.action_cls = action_cls

    def __call__(self, value):
        if isinstance(value, self.action_cls):
            return value
        value = self._validate_pre(value)
        action_type = value.pop('type', None)
        if action_type is None:
            raise Error('no action "type" specified')
        action_sig = _action_sig(action_type)
        if action_sig not in Action.mapped():
            raise Error('unknown action type specified:', action_type)
        action_cls = Action.mapped()[action_sig]
        if not issubclass(action_cls, self.action_cls):
            raise Error('action must be an instance of:', self.action_cls)
        value = {k: v for (k, v) in value.items() if k != 'type'}
        return action_cls(**value)


def load_actions(filename='actions.yaml'):
    """ Load all defined actions within the currently active app."""
    return _load_actions(filename)


def _load_actions(filename):
    return [a for p in get_packages()
              for a in _load_actions_from(p, filename)]


@autoreload
def _load_actions_from(package, filename, open=open):
    if not package.exists(filename):
        return []
    with open(package.abspath(filename)) as f:
        return SeqVal(ActionVal()).parse(f)
