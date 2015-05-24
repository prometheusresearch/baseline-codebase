"""

    rex.workflow.action_tree
    ========================

    :copyright: 2015, Prometheus Research, LLC

"""

import yaml
from collections import Mapping

from rex.core import Validate, Error, Location, guard
from rex.core import MapVal, StrVal, ProxyVal, MaybeVal
from rex.widget import TransitionableRecord
from rex.widget.validate import DeferredVal

from .action import load_actions

__all__ = ('ActionTreeVal',)


class ActionTree(TransitionableRecord):

    fields = ('tree', 'actions')

    __transit_tag__ = 'map'

    def __transit_format__(self):
        return {'tree': self.tree, 'actions': self.actions}

    def __call__(self, req, path=()):
        return {
            'tree': self.tree,
            'actions': {k: v(req, path=path + ('actions', k))
                        for k, v in self.actions.items()}
        }


class ActionLevelVal(Validate):

    _construct_level = MapVal(DeferredVal(), DeferredVal()).construct
    _str_val = StrVal()

    def __init__(self, actions, context=None):
        self.actions = actions
        self.context = context or {}

    def next_level_val(self, context_update):
        next_context = {}
        next_context.update(self.context)
        next_context.update(context_update)
        return ActionLevelVal(self.actions, context=next_context)

    def typecheck(self, action_id):
        if not action_id in self.actions:
            raise Error('unknown action found:', action_id)
        inputs, outputs = self.actions[action_id].context()
        # typecheck current level
        for label, typ in inputs.items():
            other_typ = self.context.get(label, NotImplemented)
            if other_typ is NotImplemented:
                raise Error('expected context to have key', label)
            if typ != other_typ:
                error = Error('expected:', 'key "%s" of type "%s"' % (label, typ))
                error.wrap('But got:', 'key "%s" of type "%s"' % (label, other_typ))
                raise error
        return inputs, outputs

    def __call__(self, value):
        level = {}
        for k, v in value.items():
            _inputs, outputs = self.typecheck(k)
            if isinstance(v, Mapping):
                v = self.next_level_val(outputs)(v)
            level[k] = v
        return level

    def construct(self, loader, node):
        level = {}
        for k, v in self._construct_level(loader, node).items():
            with guard("While parsing:", Location.from_node(k.node)):
                k = k.construct(self._str_val)
                _inputs, outputs = self.typecheck(k)
            if isinstance(v.node, yaml.MappingNode):
                v = v.construct(self.next_level_val(outputs))
            else:
                v = v.construct()
            level[k] = v
        return level


class ActionTreeVal(Validate):

    def __init__(self, _actions=None):
        self._actions = _actions

    @property
    def actions(self):
        actions = self._actions if self._actions else load_actions()
        return {a.id: a for a in actions}

    def _construct(self, tree_factory):
        actions = self.actions
        validate = ActionLevelVal(actions)
        tree = tree_factory(validate)
        keys = tree_keys(tree)
        return ActionTree(
            tree=tree,
            actions={k: v for k, v in actions.items() if k in keys})

    def construct(self, loader, node):
        return self._construct(lambda v: v.construct(loader, node))

    def __call__(self, tree):
        if isinstance(tree, ActionTree):
            return tree
        return self._construct(lambda v: v(tree))


def tree_keys(tree):
    keys = set()
    for k, v in tree.items():
        keys.add(k)
        if isinstance(v, Mapping):
            keys = keys | tree_keys(v)
    return keys
