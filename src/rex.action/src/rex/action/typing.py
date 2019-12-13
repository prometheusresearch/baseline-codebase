"""

    rex.action.typing
    =================

    This module implements type system for Rex Action applications.

    :copyright: 2015, Prometheus Research, LLC

"""



import re
import ast
from collections import Mapping

from werkzeug.local import LocalStack

from htsql.core.classify import classify
from htsql.core.syn.parse import parse as parse_htsql
from htsql.core.model import TableArc
from htsql.core.classify import relabel

from rex.port import Port
from rex.port.grow import GrowCalculation
from rex.port.arm import TrunkArm, FacetArm
from rex.core import Error, Validate
from rex.core import StrVal, OneOfVal, MapVal, SeqVal
from rex.widget import TransitionableRecord, as_transitionable

from .state_expression import StateExpressionVal, is_state_expression
from functools import reduce

__all__ = (
    'anytype',
    'EntityType',
    'ValueType',
    'TypeVal',
    'anytype',
    'string',
    'number',

    'unify',
    'intersect_record_types',
    'UnificationError',
    'KindError',
    'KindsDoNotMatch',
    'UnknownKind',
    'InvalidRowTypeUsage',
    'RecordTypeMissingKey',
    'RowTypeMismatch',
    )


class Type(TransitionableRecord):

    __transit_tag__ = 'map'

    type_name = NotImplemented

    @property
    def key(self):
        raise NotImplementedError('%s.key is not implemented' % \
            self.__class__.__name__)

    def __transit_format__(self, req, path):
        return self._asdict()

    def __str__(self):
        return self.key

    __unicode__ = __str__


class AnyType(Type):

    fields = ()

    type_name = 'any'

    @property
    def key(self):
        return 'any'

    __transit_tag__ = 'type:any'

    def __transit_format__(self, req, path):
        return []


anytype = AnyType()


class ValueType(Type):

    fields = ('name',)

    type_name = 'value type'

    @property
    def key(self):
        return self.name

    __transit_tag__ = 'type:any'

    def __transit_format__(self, req, path):
        return self.name


string = ValueType('string')
number = ValueType('number')


class EntityType(Type):

    fields = ('name', 'state')

    type_name = 'entity type'

    def __init__(self, name, state=None):
        super(EntityType, self).__init__(name=name, state=state)

    @property
    def key(self):
        if self.state is None:
            return self.name
        else:
            return '%s[%s]' % (self.name, self.state.name)

    __transit_tag__ = 'type:entity'

    def __transit_format__(self, req, path):
        return [self.name, self.state]


class EntityTypeState(TransitionableRecord):

    __transit_tag__ = 'map'

    def __transit_format__(self, req, path):
        return self._asdict()

    fields = ('name', 'title', 'expression', 'input')

    def __init__(self, name, expression, title=None, input=None):
        super(EntityTypeState, self).__init__(
            name=name,
            expression=expression,
            title=title,
            input=input)


class TypeVal(Validate):

    _validate = StrVal()
    _validate_state_expression = StateExpressionVal()
    _type_with_state = re.compile(r'([a-zA-Z_]+)\[([^\]]+)\]')

    def __call__(self, value):
        dom = Domain.current()
        value = self._validate(value)
        if is_state_expression(value):
            m = self._type_with_state.match(value)
            if m:
                name, state = m.groups()
                typ = dom[name]
                state = self._validate_state_expression(state)
                return dom.register_syn_state(typ, state)
            else:
                raise Error('Invalid type found:', value)
        else:
            return dom[value]


class OpaqueTypeVal(Validate):

    _validate = StrVal(pattern=r'[a-zA-Z_][a-zA-Z_\-0-9]*')

    def __call__(self, value):
        value = self._validate(value)
        return EntityType(value)


class RowType(Type):

    fields = ('name', 'type')

    type_name = 'row type'

    @property
    def key(self):
        return '%s: %s' % (self.name, self.type.key)

    __transit_tag__ = 'type:row'

    def __transit_format__(self, req, path):
        return [self.name, self.type]


class RowTypeVal(Validate):

    _validate_type = TypeVal()
    _validate = OneOfVal(_validate_type, MapVal(StrVal(), _validate_type))
    _invalid_names = set(['user'])

    def _validate_name(self, name):
        if name.lower() in self._invalid_names:
            error = Error(
                'Invalid name for a rowtype (you need to pick another one):',
                name)
            raise error
        return name

    def __call__(self, value):
        if isinstance(value, RowType):
            return value
        value = self._validate(value)
        if isinstance(value, Type):
            return RowType(name=self._validate_name(value.name), type=value)
        if len(value) != 1:
            raise Error('Row type expects a single definition')
        name, typ = next(iter(value.items()))
        return RowType(name=self._validate_name(name), type=typ)


class RecordType(Type):

    fields = ('rows', 'open')

    type_name = 'record type'

    def __init__(self, rows, open=True):
        if not isinstance(rows, Mapping):
            rows = {row.name: row for row in rows}
        super(RecordType, self).__init__(rows=rows, open=open)

    def refine(self, rows):
        if isinstance(rows, self.__class__):
            rows = rows.rows
        next_rows = dict(self.rows)
        for k, v in list(rows.items()):
            if not k in next_rows:
                continue
            if not isinstance(v, RowType):
                v = RowType(k, v)
            next_rows[k] = v
        return self.__class__(next_rows, open=self.open)

    @property
    def key(self):
        rows = [row.key for _, row in sorted(self.rows.items())]
        if self.open:
            rows.append('  ...other keys')
        return '{\n' + '\n'.join(rows) + '\n}'

    @classmethod
    def empty(cls):
        return cls(rows={}, open=True)

    __transit_tag__ = 'type:record'

    def __transit_format__(self, req, path):
        return [self.rows, self.open]


class RecordTypeVal(Validate):

    _validate = SeqVal(RowTypeVal())

    def __init__(self, open=True):
        self.open = open

    def __call__(self, value):
        if isinstance(value, RecordType):
            if self.open is not value.open:
                if self.open:
                    raise Error('Expected an open record but got a closed one')
                else:
                    raise Error('Expected a closed record but got an open one')
            return value
        value = self._validate(value)
        seen = set()
        rows = {}
        for row in value:
            if row.name in seen:
                raise Error('Duplicate row name in type:', row.name)
            seen.add(row.name)
            rows[row.name] = row
        return RecordType(rows=rows, open=self.open)


DEFAULT_VALUE_TYPES = {
    'text': ValueType('text'),
    'number': ValueType('number'),
    'boolean': ValueType('boolean'),
    'date': ValueType('date'),
    'datetime': ValueType('datetime'),
}


class Domain(object):
    """ Domain object represents application domain as a set of possible value
    types (string, number, boolean, ...) and entity types.
    """

    _stack = LocalStack()

    _validate_opaque_type = OpaqueTypeVal()

    @classmethod
    def current(cls):
        dom = cls._stack.top
        if dom is None:
            return _default_domain
        return dom

    def __init__(self, name=None, entity_types=None):
        entity_types = entity_types or []
        self.name = name
        self.value_types = DEFAULT_VALUE_TYPES
        self.entity_types = {typ.key: typ for typ in entity_types}
        self.syn_entity_state = {}

    def merge(self, domain):
        if domain is None:
            return self
        next_domain = Domain(
            name=self.name,
            entity_types=list(self.entity_types.values()))
        next_domain.entity_types.update({
            typ.key: typ for typ
                         in list(domain.entity_types.values())
        })
        for entity_name in self.syn_entity_state:
            (next_domain
                .syn_entity_state.setdefault(entity_name, {})
                .update(self.syn_entity_state[entity_name]))
        for entity_name in domain.syn_entity_state:
            (next_domain
                .syn_entity_state.setdefault(entity_name, {})
                .update(domain.syn_entity_state[entity_name]))
        return next_domain

    def get_type(self, type_name):
        if type_name == 'any':
            return anytype
        elif type_name in self.value_types:
            return self.value_types[type_name]
        elif type_name in self.entity_types:
            return self.entity_types[type_name]
        else:
            return self._validate_opaque_type(type_name)

    def register_syn_state(self, typ, expression):
        state = EntityTypeState(expression.name, expression=expression)
        self.syn_entity_state.setdefault(typ.name, {})[state.name] = state
        return EntityType(typ.name, state=state)

    def get_states_for_type(self, type_name):
        return {typ.state.name: typ.state
                for typ in list(self.entity_types.values())
                if typ.name == type_name}

    def record(self, *rows_args, **rows_kwargs):
        rows = {}
        rows.update({v.name: v for v in rows_args})
        rows.update({k: RowType(k, self[v] if not isinstance(v, Type) else v)
                     for k, v in list(rows_kwargs.items())})
        return RecordType(rows=rows, open=True)

    def on(self):
        self._stack.push(self)

    def off(self):
        assert self._stack.top is self
        self._stack.pop()

    def __getitem__(self, type_name):
        return self.get_type(type_name)

    def __enter__(self):
        self.on()
        return self

    def __exit__(self, _exc_type, _exc_value, _tb):
        self.off()

    def __repr__(self):
        return '<%s %s>' % (self.__class__.__name__, self.name or 'unnamed')


@as_transitionable(Domain, tag='rex:action:domain')
def _encode_Domain(domain, req, path):
    return [domain.syn_entity_state]

_default_domain = Domain(name='default')


def annotate_port(domain, port):
    """ Annotate port with typing information.

    :param domain: Domain
    :type port: :class:`Domain`

    :param port: Port
    :type port: :class:`rex.port.Port`

    :return: An annotated port
    :rtype: :class:`rex.port.Port`
    """

    tree = port.tree

    with port.db:
        for path, arm in port.tree.walk():
            if isinstance(arm, (TrunkArm, FacetArm)):
                arc = TableArc(arm.table)
                labels = relabel(arc)
                name = labels[0].name
                typ = domain[arm.table.name]
                tree = grow_type_info(tree, path, name)
                tree = grow_title_info(tree, path, arm)
                for state in list(domain.get_states_for_type(typ.name).values()):
                    tree = grow_state_info(tree, path, state)


    return Port(tree=tree, db=port.db)


def _get_title_column(table_node, columns_to_try=('__title__', 'title')):
    for column in columns_to_try:
        for label in classify(table_node):
            if label.name == column:
                return column
    return 'id()'


def grow_title_info(tree, path, arm):
    title_column = _get_title_column(arm.arc.target)
    expression = parse_htsql(title_column)
    grow = GrowCalculation('meta:title', path, expression)
    tree = grow(tree)
    return tree


def grow_type_info(tree, path, name):
    expression = parse_htsql("'%s'" % name)
    grow = GrowCalculation('meta:type', path, expression)
    tree = grow(tree)
    return tree


def grow_state_info(tree, path, state):
    expression = parse_htsql(state.expression)
    grow = GrowCalculation('meta:state:%s' % state.name, path, expression)
    tree = grow(tree)
    return tree


class UnificationError(Exception):
    """ Base class for type unification errors."""
    

class KindError(UnificationError):
    """ Kind error.

    This arises when we try to unify topologically inconsistent types, for
    example row type and entity type.
    """

class KindsDoNotMatch(KindError):
    """ Type kinds do not match."""

    def __init__(self, kind_a, type_a, kind_b, type_b):
        self.kind_a = kind_a
        self.type_a = type_a
        self.kind_b = kind_b
        self.type_b = type_b


class UnknownKind(KindError):
    """ One or more kinds are unknown and can't be typechecked."""

    def __init__(self, kind_a, type_a, kind_b, type_b):
        self.kind_a = kind_a
        self.type_a = type_a
        self.kind_b = kind_b
        self.type_b = type_b


class InvalidRowTypeUsage(KindError):
    """ Row type is used without the wrapping record type."""


class RecordTypeMissingKey(UnificationError):
    """ Record type is missing a key of type ``row_type``."""

    def __init__(self, type):
        self.type = type


class RowTypeMismatch(UnificationError):
    """ Row type mismatch."""

    def __init__(self, type_a, type_b):
        self.type_a = type_a
        self.type_b = type_b


GLOBAL_ROWS = set(['USER'])


def unify(type_a, type_b, label=None):
    """ Try to unify ``type_a`` against ``type_b``."""
    assert isinstance(type_a, Type), 'Expected a type, got: %s' % type_a
    assert isinstance(type_b, Type), 'Expected a type, got: %s' % type_b
    if type_a is anytype or type_b is anytype:
        return
    kind_a = type(type_a)
    kind_b = type(type_b)
    if kind_a != kind_b:
        raise KindsDoNotMatch(kind_a, type_a, kind_b, type_b)
    elif kind_a is RowType:
        raise InvalidRowTypeUsage()
    elif kind_a is RecordType:
        for label, typ in list(type_a.rows.items()):
            if label in GLOBAL_ROWS:
                continue
            other_typ = type_b.rows.get(label, NotImplemented)
            if other_typ is NotImplemented:
                raise RecordTypeMissingKey(typ)
            unify(typ.type, other_typ.type, label=label)
    elif kind_a is ValueType:
        if type_a.name != type_b.name:
            raise RowTypeMismatch(
                RowType(label, type_a),
                RowType(label, type_b))
    elif kind_a is EntityType:
        if type_a.name != type_b.name:
            raise RowTypeMismatch(
                RowType(label, type_a),
                RowType(label, type_b))
    elif kind_a is OpaqueEntityType:
        if type_a.name != type_b.name:
            raise RowTypeMismatch(
                RowType(label, type_a),
                RowType(label, type_b))
    else:
        raise UnknownKind(kind_a, type_a, kind_b, type_b)


class EntityStateScope(Mapping):

    def __init__(self, entity):
        self.entity = entity

    def __len__(self):
        return len(iter(self))

    def __iter__(self):
        return iter(k for k in self.entity if k.startswith('meta:state:'))

    def __getitem__(self, key):
        internal_key = 'meta:state:%s' % key
        if not internal_key in self.entity:
            raise KeyError(key)
        return self.entity[internal_key]


def _intersect_record_types(a, b):
    rows = {}
    intersection = list(set(a.rows) & set(b.rows))
    a_record = RecordType({name: a.rows[name] for name in intersection})
    b_record = RecordType({name: b.rows[name] for name in intersection})
    unify(a_record, b_record)
    return a_record # b_record is equivalent here


def intersect_record_types(record_types):
    if len(record_types) == 0:
        return RecordType.empty()
    elif len(record_types) == 1:
        return record_types[0]
    else:
        return reduce(_intersect_record_types, record_types)
