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

    _validate_level = MapVal(StrVal(), DeferredVal())

    def __init__(self, actions, context=None):
        self.actions = actions
        self.context = context or {}

    def next_level_val(self, context_update):
        context = _context_update(self.context, context_update)
        return ActionLevelVal(self.actions, context=context)

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
        for k, v in self._validate_level.construct(loader, node).items():
            with guard("While parsing:", Location.from_node(v.node)):
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

    def construct(self, loader, node):
        actions = self.actions
        validate = ActionLevelVal(actions)
        tree = validate.construct(loader, node)
        used_actions = _used_keys(tree)
        actions = {k: v for k, v in actions.items() if k in used_actions}
        return ActionTree(tree=tree, actions=actions)

    def __call__(self, tree):
        if isinstance(tree, ActionTree):
            return tree
        actions = self.actions
        validate = ActionLevelVal(actions)
        tree = validate(tree)
        used_actions = _used_keys(tree)
        actions = {k: v for k, v in actions.items() if k in used_actions}
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
