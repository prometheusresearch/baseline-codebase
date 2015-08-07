"""

    rex.action.typing
    =================

    This module implements type system for Rex Action applications.

    :copyright: 2015, Prometheus Research, LLC

"""

import re
from collections import Mapping

from werkzeug.local import LocalStack

from htsql.core.syn.parse import parse as parse_htsql
from rex.port import Port
from rex.port.grow import GrowCalculation
from rex.port.arm import TrunkArm, FacetArm
from rex.core import Error, Validate
from rex.core import StrVal, OneOfVal, MapVal, SeqVal
from rex.widget import TransitionableRecord

__all__ = (
    'anytype',
    'EntityType',
    'ValueType',
    'TypeVal',
    'unify', 'UnificationError')


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

    def __call__(self, value):
        value = self._validate(value)
        typ = Domain.current()[value]
        return typ


class OpaqueTypeVal(Validate):

    _validate = StrVal(pattern='[a-zA-Z\-_]+')

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

    def __call__(self, value):
        if isinstance(value, RowType):
            return value
        value = self._validate(value)
        if isinstance(value, Type):
            return RowType(name=value.name, type=value)
        if len(value) != 1:
            raise Error('Row type expects a single definition')
        name, typ = value.iteritems().next()
        return RowType(name=name, type=typ)


class RecordType(Type):

    fields = ('rows', 'open')

    type_name = 'record type'

    def __init__(self, rows, open=True):
        if not isinstance(rows, Mapping):
            rows = {row.name: row for row in rows}
        super(RecordType, self).__init__(rows=rows, open=open)

    @property
    def key(self):
        rows = [row.key for row in sorted(self.rows)]
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

    def get_type(self, type_name):
        if type_name == 'any':
            return anytype
        elif type_name in self.value_types:
            return self.value_types[type_name]
        elif type_name in self.entity_types:
            return self.entity_types[type_name]
        else:
            return self._validate_opaque_type(type_name)

    def get_states_for_type(self, type_name):
        return {typ.state.name: typ.state
                for typ in self.entity_types.values()
                if typ.name == type_name}

    def record(self, *rows_args, **rows_kwargs):
        rows = {}
        rows.update({v.name: v for v in rows_args})
        rows.update({k: RowType(k, self[v] if not isinstance(v, Type) else v)
                     for k, v in rows_kwargs.items()})
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
                typ = domain[arm.table.name]
                tree = grow_type_info(tree, path, typ)
                for state in domain.get_states_for_type(typ.name).values():
                    tree = grow_state_info(tree, path, state)


    return Port(tree=tree, db=port.db)


def grow_type_info(tree, path, typ):
    expression = parse_htsql("'%s'" % typ.name)
    grow = GrowCalculation(u'meta:type', path, expression)
    tree = grow(tree)
    return tree


def grow_state_info(tree, path, state):
    expression = parse_htsql(state.expression)
    grow = GrowCalculation(u'meta:state:%s' % state.name, path, expression)
    tree = grow(tree)
    return tree


class UnificationError(Error):

    def __init__(self, type_a, type_b, payload=None):
        super(UnificationError, self).__init__('Cannot unify two types', payload)
        self.wrap('Type:', type_a)
        self.wrap('With type:', type_b)
        self.type_a = type_a
        self.type_b = type_b


def unify(type_a, type_b):
    if type_a is anytype or type_b is anytype:
        return
    kind_a = type(type_a)
    kind_b = type(type_b)
    if kind_a != kind_b:
        error = UnificationError(type_a, type_b, 'kinds do not match')
        raise error
    elif kind_a is RecordType:
        for label, row_type_a in type_a.rows.items():
            if label == 'USER':
                continue
            row_type_b = type_b.fields.get(label, NotImplemented)
            if row_type_b is NotImplemented:
                raise UnificationError(type_a, type_b, 'Type is missing "%s: %s"' % (label, row_type_a))
            unify(row_type_a, row_type_b)
        for label, row_type_b in type_b.rows.items():
            if label == 'USER':
                continue
            row_type_a = type_a.fields.get(label, NotImplemented)
            if row_type_a is NotImplemented:
                raise UnificationError(type_a, type_b, 'Type is missing "%s: %s"' % (label, row_type_b))
            unify(row_type_a, row_type_b)
    elif kind_a is ValueType:
        if type_a.domain != type_b.domain:
            raise UnificationError(type_a, type_b, 'value types do not match')
    elif kind_a is EntityType:
        if type_a.name != type_b.name:
            raise UnificationError(type_a, type_b, 'entity types do not match')
        elif type_a.state is None or type_b.state is None:
            return
        elif type_a.state != type_b.state:
            error = UnificationError(type_a, type_b, 'Entity types do not match')
            error.wrap('Type:', type_a)
            error.wrap('With type:', type_b)
            raise error

    else:
        raise UnificationError(type_a, type_b, 'unknown kind')
