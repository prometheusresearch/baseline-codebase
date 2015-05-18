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

from rex.widget import Widget, Field

__all__ = ('Action', 'ActionVal', 'load_actions')


class ActionMeta(Widget.__metaclass__):

    def __new__(mcs, name, bases, attrs):
        if 'name' in attrs:
            attrs['name'] = _action_sig(attrs['name'])
        cls = Widget.__metaclass__.__new__(mcs, name, bases, attrs)
        return cls


_action_sig = namedtuple('Action', ['name'])


class Action(Widget):
    """ Action is a reusable piece of UI.

    Actions are consumed within a workflow.
    """

    __metaclass__ = ActionMeta

    id = Field(
        StrVal(),
        doc="""
        """)

    title = Field(
        MaybeVal(StrVal()), default=None,
        doc="""
        """)

    icon = Field(
        MaybeVal(StrVal()), default=None,
        doc="""
        """)

    def context(self):
        """ Compute context specification for an action.
        """
        raise NotImplementedError('%s.context() is not implemented' % \
                                  self.__class__.__name__)

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
