"""

    rex.workflow.action_tree
    ========================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import Mapping

from rex.core import Validate, Error, MapVal, StrVal, ProxyVal, MaybeVal
from rex.widget import TransitionableRecord

from .action import load_actions

__all__ = ('ActionTreeVal',)


class ActionTree(TransitionableRecord):
    fields = ('tree', 'actions')

    __transit_tag__ = 'map'

    def __transit_format__(self):
        return {'tree': self.tree, 'actions': self.actions}


class ActionTreeVal(Validate):

    _validate = ProxyVal()
    _validate_level = MapVal(StrVal(), MaybeVal(_validate))
    _validate.set(_validate_level)

    def __init__(self, _actions=None):
        self._actions = _actions

    def __call__(self, tree):
        if isinstance(tree, ActionTree):
            return tree
        tree = self._validate(tree)
        used_actions = _used_keys(tree)
        actions = self._actions if self._actions else load_actions()
        actions = {a.id: a for a in actions if a.id in used_actions}
        _typecheck(actions, tree)
        return ActionTree(tree=tree, actions=actions)


def _typecheck(actions, tree, context=None):
    context = context or {}
    for k, v in tree.items():
        if not k in actions:
            raise Error('unknown action found:', k)
        action = actions[k]
        inputs, outputs = action.context()
        _typecheck_step(context, inputs)
        if isinstance(v, Mapping):
            _typecheck(actions, v, context=_context_update(context, outputs))


def _typecheck_step(context, inputs):
    for k, v in inputs.items():
        w = context.get(k, NotImplemented)
        if w is NotImplemented:
            raise Error('expected context to have key', k)
        if v != w:
            error = Error('expected:', 'key "%s" of type "%s"' % (k, v))
            error.wrap('But got:', 'key "%s" of type "%s"' % (k, w))
            raise error


def _context_update(context, outputs):
    next_context = {}
    next_context.update(context)
    next_context.update(outputs)
    return next_context


def _used_keys(tree):
    used = set()
    for k, v in tree.items():
        used.add(k)
        if isinstance(v, Mapping):
            used = used | _used_keys(v)
    return used
