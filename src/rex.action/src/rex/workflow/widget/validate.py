"""

    rex.w.validate
    ==============

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple

from rex.core import Validate, ProxyVal
from rex.core import RecordVal, ChoiceVal, OneOfVal, StrVal, IntVal, SeqVal, BoolVal
from rex.widget.modern import URLVal, undefined
from rex.widget.json_encoder import register_adapter

__all__ = ('KeyPathVal', 'FieldDescVal', 'ColumnVal')


class KeyPathVal(Validate):

    _validate = SeqVal(OneOfVal(IntVal(), StrVal()))
    _validate_with_shortcut = OneOfVal(_validate, StrVal(), IntVal())

    def __call__(self, value):
        value = self._validate_with_shortcut(value)
        if isinstance(value, basestring):
            if '.' in value:
                value = [v for v in value.split('.') if v]
            else:
                value = [value]
        if isinstance(value, int):
            return [value]
        return [try_to_int(v) for v in value]

    @staticmethod
    def to_string(keypath):
        return '.'.join(str(v) for v in keypath)


def try_to_int(v):
    try:
        return int(v)
    except ValueError:
        return v


class ColumnVal(Validate):

    _validate = RecordVal(
        ('key', KeyPathVal()),
        ('name', StrVal(), undefined),
        ('expression', StrVal(), undefined),
        ('sortable', BoolVal(), undefined),
        ('resizable', BoolVal(), undefined),
    )

    def __call__(self, value):
        return self._validate(value)


@register_adapter(ColumnVal._validate.record_type)
def _encode_Column(col):
    return {k: v for (k, v) in col._asdict().items() if v is not undefined}


class EnumItemVal(Validate):

    _validate = RecordVal(
        ('value', StrVal()),
        ('name', StrVal(), None)
    )
    _validate_with_shortcut = OneOfVal(StrVal(), _validate)

    def __call__(self, value):
        value = self._validate_with_shortcut(value)
        if isinstance(value, basestring):
            value = self._validate.record_type(value=value, name=value)
        if value.name is None:
            value = value.__clone__(name=value.value)
        return value


class FieldDescVal(Validate):

    _scalar_types = (
        'string',
        'date',
        'datetime',
        'int',
        'float',
        'bool',
    )

    _validate = ProxyVal()

    _common_fields = [
        ('key', KeyPathVal()),
        ('name', StrVal(), None),
    ]

    _validate_scalar = RecordVal(_common_fields + [
        ('type', ChoiceVal(*_scalar_types), 'string'),
    ])

    _validate_entity = RecordVal(_common_fields + [
        ('type', ChoiceVal('entity')),
        ('fields', SeqVal(_validate))
    ])

    _validate_list = RecordVal(_common_fields + [
        ('type', ChoiceVal('list')),
        ('item_fields', SeqVal(_validate))
    ])

    _validate_file = RecordVal(_common_fields + [
        ('type', ChoiceVal('file')),
        ('storage', URLVal()),
        ('download', URLVal()),
    ])

    _validate_enum = RecordVal(_common_fields + [
        ('type', ChoiceVal('enum')),
        ('values', SeqVal(EnumItemVal()))
    ])

    _validate.set(OneOfVal(
        KeyPathVal(),
        _validate_scalar,
        _validate_entity,
        _validate_list,
        _validate_enum,
        _validate_file,
    ))

    def __call__(self, value):
        if isinstance(value, (
                self._validate_scalar.record_type,
                self._validate_entity.record_type)):
            return value
        value = self._validate(value)
        if isinstance(value, list):
            return self._validate_scalar.record_type(
                key=value,
                name=KeyPathVal.to_string(value),
                type='string')
        if value.name is None:
            value = value.__clone__(name=KeyPathVal.to_string(value.key))
        return value
