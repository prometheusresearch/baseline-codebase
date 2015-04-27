"""

    rex.workflow.action
    ===================

    This module provides :class:`Action` class which is used to describe actions
    within an application.

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Error, Validate
from rex.core import RecordVal, StrVal, SeqVal, MapVal, AnyVal
from rex.core import Extension, cached, autoreload, get_packages

__all__ = ('Action', 'ActionVal', 'load_actions')


class Action(Extension):
    """ Action is a reusable piece of UI.

    Actions are consumed within a workflow.
    """

    type = NotImplemented

    fields = ()

    def __init__(self, params, package):
        self.params = params
        self.package = package

    @property
    def id(self):
        """ Specify what id to use for the action."""
        raise NotImplementedError('%s.id is not implemented' % \
                                  self.__class__.__name__)

    @property
    def title(self):
        """ Specify what title to use for the action."""
        raise NotImplementedError('%s.title is not implemented' % \
                                  self.__class__.__name__)

    @property
    def icon(self):
        """ Specify what icon to use for the action."""
        raise NotImplementedError('%s.icon is not implemented' % \
                                  self.__class__.__name__)

    def context(self):
        """ Compute context specification for an action.
        """
        raise NotImplementedError('%s.context() is not implemented' % \
                                  self.__class__.__name__)

    def render(self):
        """ Return a renderable structure.

        Renderable structure is an opaque data structure which is interpreted by
        workflow.
        """
        raise NotImplementedError('%s.render() is not implemented' % \
                                  self.__class__.__name__)

    def __str__(self):
        params = ', '.join('%s=%r' % kv for kv in self.params.items())
        return '%s(%s)' % (self.__class__.__name__, params)

    __unicode__ = __str__
    __repr__ = __str__

    @classmethod
    def signature(cls):
        return cls.type

    @classmethod
    def enabled(cls):
        return cls.type is not NotImplemented

    @classmethod
    def validate(cls, value):
        return ActionVal(action_cls=cls)(value)


class ActionVal(Validate):
    """ Validator for actions."""

    _validate_pre = MapVal(StrVal(), AnyVal())

    def __init__(self, action_cls=Action, package=None):
        self.package = package or action_cls.package()
        self.action_cls = action_cls

    def __call__(self, value):
        if isinstance(value, self.action_cls):
            return value
        value = self._validate_pre(value)
        action_type = value.pop('type', None)
        if action_type is None:
            raise Error('no action "type" specified')
        if action_type not in Action.mapped():
            raise Error('unknown action type specified:', action_type)
        action_cls = Action.mapped()[action_type]
        if not issubclass(action_cls, self.action_cls):
            raise Error('action must be an instance of:', self.action_cls)
        validate = RecordVal(*action_cls.fields)
        value = {k: v for (k, v) in value.items() if k != 'type'}
        params = validate(value)._asdict()
        return action_cls(params, self.package)


def load_actions(package, filename='actions.yaml'):
    assert package
    """ Load all defined actions within the currently active app."""
    return _load_actions(package, filename)


def _load_actions(package, filename):
    return [a for p in get_packages()
              for a in _load_actions_from(package, p, filename)]


@autoreload
def _load_actions_from(package, load_from_package, filename, open=open):
    if not load_from_package.exists(filename):
        return []
    with open(load_from_package.abspath(filename)) as f:
        return SeqVal(ActionVal(package=package)).parse(f)
