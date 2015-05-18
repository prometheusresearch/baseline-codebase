"""

    rex.workflow.action_tree
    ========================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import Mapping

from rex.core import Validate, Error, MapVal, StrVal, ProxyVal
from rex.widget import TransitionableRecord

__all__ = ('ActionTreeVal',)


class ActionTree(TransitionableRecord):
    fields = ('tree', 'actions')

    __transit_tag__ = 'map'

    def __transit_format__(self):
        return {'tree': self.tree, 'actions': self.actions}


class ActionTreeVal(Validate):

    def __call__(self, tree):
        if isinstance(tree, ActionTree):
            return tree
        tree = self._validate(tree)
        used_actions = _used_keys(tree)
        actions = {a.id: a for a in load_actions() if a in used_actions}
        _typecheck(actions, tree)
        return ActionTree(tree=tree, actions=actions)


def _typecheck(actions, tree, context=None):
    context = context or {}
    for k, v in tree.items():
        if not k in actions:
            raise Error('TODO')
        action = actions[k]
        inputs, outputs = action.context()
        _typecheck_step(context, inputs)
        if isinstance(v, Mapping):
            _typecheck(actions, v, context=_context_update(context, outputs))


def _typecheck_step(context, inputs):
    for k, v in inputs.items():
        w = context.get(k, NotImplemented)
        if w is NotImplemented:
            raise Error('TODO')
        if isinstance(w, (list, tuple)) and isinstance(v, (list, tuple)):
            if not (set(w) & set(v)):
                raise Error('TODO')
        elif isinstance(w, (list, tuple)):
            if not any(v == wi for wi in w):
                raise Error('TODO')
        elif isinstance(v, (list, tuple)):
            if not any(w == vi for vi in v):
                raise Error('TODO')
        else:
            if v != w:
                raise Error('TODO')


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
