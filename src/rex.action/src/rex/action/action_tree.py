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

from .typing import Type, anytype, ValueType, EntityType, RecordType, RowType

__all__ = ('ActionTreeVal',)


class ActionTree(TransitionableRecord):

    fields = ('tree',)

    __transit_tag__ = 'map'

    def __transit_format__(self, req, path):
        return self.tree


def format_context(context):
    if not context.rows:
        return '<empty context>'
    return ''.join('%s: %s' % (k, v.type.key) for k, v in sorted(context.rows.items()))


def type_name(kind):
    return kind.type_name if hasattr(kind, 'type_name') and kind.type_name is not NotImplemented else repr(kind)

def assert_is_type(maybe_type):
    assert isinstance(maybe_type, Type), 'Expected a type, got: %s' % maybe_type

def unify(type_a, type_b, action_id, label=None):
    assert_is_type(type_a)
    assert_is_type(type_b)
    if type_a is anytype or type_b is anytype:
        return
    kind_a = type(type_a)
    kind_b = type(type_b)
    if kind_a != kind_b:
        error = Error('Unification error:', 'type kinds do not match')
        error.wrap('One type is %s:' % type_name(kind_a), type_a)
        error.wrap('Another type is %s:' % type_name(kind_b), type_b)
        raise error
    elif kind_a is RowType:
        raise Error('Row types are only valid within a record types')
    elif kind_a is RecordType:
        for label, typ in type_a.rows.items():
            if label == 'USER':
                continue
            other_typ = type_b.rows.get(label, NotImplemented)
            if other_typ is NotImplemented:
                raise Error(
                    'Action "%s" cannot be used here:' % action_id,
                    'Context is missing "%s"' % typ)
            unify(typ.type, other_typ.type, action_id, label=label)
    elif kind_a is ValueType:
        if type_a.name != type_b.name:
            raise Error(
                'Action "%s" cannot be used here:' % action_id,
                'Context has "%s: %s" but expected to have "%s: %s"' % (
                    label, type_b, label, type_a))
    elif kind_a is EntityType:
        if type_a.name != type_b.name:
            raise Error(
                'Action "%s" cannot be used here:' % action_id,
                'Context has "%s: %s" but expected to have "%s: %s"' % (
                    label, type_b, label, type_a))
        elif type_a.state is None or type_b.state is None:
            return
        elif type_a.state != type_b.state:
            raise Error(
                'Action "%s" cannot be used here:' % action_id,
                'Context has "%s: %s" but expected to have "%s: %s"' % (
                    label, type_b, label, type_a))
    elif kind_a is OpaqueEntityType:
        if type_a.name != type_b.name:
            raise Error(
                'Action "%s" cannot be used here:' % action_id,
                'Context has "%s: %s" but expected to have "%s: %s"' % (
                    label, type_b, label, type_a))
    else:
        error = Error('Unification error:', 'unknown kinds')
        error.wrap('One type of kind %s' % kind_a, type_a)
        error.wrap('Another type of kind %s' % kind_b, type_b)
        raise error


class ActionLevelVal(Validate):

    _construct_level = OMapVal(DeferredVal(), DeferredVal()).construct
    _str_val = StrVal()

    def __init__(self, actions, path=None, context=None):
        self.actions = actions
        self.path = path or []
        self.context = context or RecordType.empty()
        assert_is_type(self.context)

    def next_level_val(self, action_id, context_update):
        next_context = RecordType.empty()
        next_context.rows.update(self.context.rows)
        next_context.rows.update({k: v for k, v in context_update.rows.items()})
        return ActionLevelVal(self.actions, path=[action_id], context=next_context)

    def typecheck(self, action_id):
        if not action_id in self.actions:
            raise Error('unknown action found:', action_id)
        input, output = self.actions[action_id].context_types
        assert_is_type(input)
        assert_is_type(output)
        try:
            unify(input, self.context, action_id)
        except Error as error:
            error.wrap('Context:', format_context(self.context))
            error.wrap('While type checking action at path:', ' -> '.join(self.path + [action_id]))
            raise error
        return input, output

    def __call__(self, value):
        level = OrderedDict()
        for k, v in value.items():
            _input, output = self.typecheck(k)
            if isinstance(v, Mapping):
                v = self.next_level_val(k, output)(v)
            level[k] = v
        return level

    def construct(self, loader, node):
        level = OrderedDict()
        for k, v in self._construct_level(loader, node).items():
            with guard("While parsing:", Location.from_node(k.node)):
                k = k.resolve(self._str_val)
                _input, output = self.typecheck(k)
            if isinstance(v.node, yaml.SequenceNode):
                v = v.resolve(self.next_level_val(k, output))
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
