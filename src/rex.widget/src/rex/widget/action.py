"""

    rex.widget.action
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple

from rex.core import Error, Extension, cached, guard
from rex.core import RecordVal, Validate, OneOfVal, SeqVal, MapVal, StrVal, AnyVal

from .json_encoder import register_adapter


__all__ = ('ActionCall', 'ActionVal', 'Action')


class Action(Extension):

    name = NotImplemented
    js_type = NotImplemented
    validate = NotImplemented

    @classmethod
    def enabled(cls):
        return cls.name is not NotImplemented

    @classmethod
    @cached
    def map_all(cls):
        mapping = {}
        for extension in cls.all():
            assert extension.name not in mapping, \
                "duplicate action %r defined by '%r' and '%r'" % (
                    extension.name, mapping[extension.name], extension)
            assert extension.validate is not NotImplemented, \
                "action %r doesn't define validate routine" % extension
            assert extension.js_type is not NotImplemented, \
                "action %r doesn't define its js_type" % extension
            mapping[extension.name] = extension
        return mapping

    @classmethod
    def make_call(cls, **params):
        return ActionCall(cls, params)


class ActionCall(namedtuple('ActionCall', ['action', 'params'])):
    """ An object which represents a configurable action call."""

    __slots__ = ()


@register_adapter(ActionCall)
def _encode_Action(action_call):
    return {
        '__action__': action_call.action.js_type,
        'params': action_call.params
    }


class ActionCallSeq(namedtuple('ActionCallSeq', ['calls'])):
    """ An object which represents a series of configurable action calls."""

    __slots__ = ()


@register_adapter(ActionCallSeq)
def _encode_ActionCallSeq(action_call_seq):
    return {
        '__actions__': action_call_seq.calls
    }


class ActionVal(Validate):
    """ Validator for :class:`ActionCall` value."""

    _validate_single_action= MapVal(StrVal(), AnyVal())
    _validate_action = OneOfVal(SeqVal(_validate_single_action), _validate_single_action)
    _validate_action_name = StrVal()

    def _construct_call(self, value):
        value = dict(value)
        if not 'action' in value:
            raise Error('Missing "action" key')
        action = self._validate_action_name(value.pop('action'))
        actions = Action.map_all()
        if not action in actions:
            raise Error('Invalid action:', action)
        action = actions[action]
        with guard('Whole validating parameters for action:', action.name):
            value = action.validate(value)
        return ActionCall(action, value)

    def _construct_call_seq(self, value):
        return ActionCallSeq([self._construct_call(item) for item in value])

    def __call__(self, value):
        if isinstance(value, (ActionCall, ActionCallSeq)):
            return value
        value = self._validate_action(value)
        if isinstance(value, list):
            return self._construct_call_seq(value)
        else:
            return self._construct_call(value)


class Set(Action):
    """ Action to update state page."""

    name = 'set'
    js_type = 'rex-widget/lib/actions/set'

    validate = RecordVal(
        ('id', StrVal()),
        ('value', AnyVal())
    )
