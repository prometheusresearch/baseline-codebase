"""

    rex.action.action_tree
    ======================

    :copyright: 2015, Prometheus Research, LLC

"""

import sys
from collections import Mapping, OrderedDict

import yaml

from rex.core import Validate, Error, Location, guard
from rex.core import OMapVal, StrVal, ProxyVal, MaybeVal
from rex.widget import TransitionableRecord
from rex.widget.validate import DeferredVal

__all__ = ('ActionTreeVal',)


class ActionTree(TransitionableRecord):

    fields = ('tree',)

    __transit_tag__ = 'map'

    def __transit_format__(self, req, path):
        return self.tree


def format_context(context):
    if not context:
        return '<empty context>'
    return ''.join('%s: %s (%s)' % (k, v[0], v[1]) for k, v in sorted(context.items()))


class ActionLevelVal(Validate):

    _construct_level = OMapVal(DeferredVal(), DeferredVal()).construct
    _str_val = StrVal()

    def __init__(self, actions, context=None):
        self.actions = actions
        self.context = context or {}

    def next_level_val(self, action_id, context_update):
        next_context = {}
        next_context.update(self.context)
        next_context.update({k: (v, action_id)
                            for k, v in context_update.items()})
        return ActionLevelVal(self.actions, context=next_context)

    def typecheck(self, action_id):
        if not action_id in self.actions:
            raise Error('unknown action found:', action_id)
        inputs, outputs = self.actions[action_id].context()
        # typecheck current level
        for label, typ in inputs.items():
            if label == 'USER':
                continue
            other_typ = self.context.get(label, NotImplemented)
            if other_typ is NotImplemented:
                error = Error(
                    'Action "%s" cannot be used here:' % action_id,
                    'Context is missing "%s: %s"' % (label, typ))
                error.wrap('Context:', format_context(self.context))
                raise error
            other_typ = other_typ[0]
            if typ != other_typ:
                error = Error(
                    'Action "%s" cannot be used here:' % action_id,
                    'Context has "%s: %s" but expected to have "%s: %s"' % (
                        label, typ, label, other_typ))
                error.wrap('Context:', format_context(self.context))
                raise error
        return inputs, outputs

    def __call__(self, value):
        level = OrderedDict()
        for k, v in value.items():
            _inputs, outputs = self.typecheck(k)
            if isinstance(v, Mapping):
                v = self.next_level_val(k, outputs)(v)
            level[k] = v
        return level

    def construct(self, loader, node):
        level = OrderedDict()
        for k, v in self._construct_level(loader, node).items():
            with guard("While parsing:", Location.from_node(k.node)):
                k = k.resolve(self._str_val)
                _inputs, outputs = self.typecheck(k)
            if isinstance(v.node, yaml.SequenceNode):
                v = v.resolve(self.next_level_val(k, outputs))
            else:
                v = v.resolve()
            level[k] = v
        return level


class ActionTreeVal(Validate):

    def __init__(self, actions, context=None, error_if_extra_actions=True):
        self.actions = actions
        self.context = context
        self.error_if_extra_actions = error_if_extra_actions

    def _construct(self, tree_factory, node=None):
        actions = self.actions
        validate = ActionLevelVal(actions, context=self.context)
        tree = tree_factory(validate)
        if self.error_if_extra_actions:
            extra_actions = set(self.actions) - tree_keys(tree)
            if extra_actions:
                warn = Error('Actions are defined but not used in wizard:',
                             ', '.join(sorted(extra_actions)))
                if node:
                    warn.wrap('While parsing:', Location.from_node(node))
                print >> sys.stderr, 'Warning:', warn

        return ActionTree(tree=tree)

    def construct(self, loader, node):
        with guard('While parsing:', Location.from_node(node)):
            return self._construct(lambda v: v.construct(loader, node),
                node=node)

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
