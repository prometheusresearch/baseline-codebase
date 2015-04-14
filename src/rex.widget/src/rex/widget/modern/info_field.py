"""

    rex.widget.modern.info_field
    ============================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple
from rex.core import Validate, Error, ProxyVal
from rex.core import RecordVal, StrVal, ChoiceVal, OneOfVal, SeqVal, BoolVal
from ..json_encoder import register_adapter
from .url import URLVal
from .dataspec import CollectionSpecVal

__all__ = ('InfoFieldVal',)


InfoField = namedtuple('InfoField', ['label', 'value_key', 'type', 'read_only', 'params'])


@register_adapter(InfoField)
def _encode_InfoField(field):
    return {
        'label': field.label,
        'valueKey': field.value_key,
        'type': field.type,
        'readOnly': field.read_only,
        'params': field.params,
    }


info_field_val = ProxyVal()


class InfoFieldVal(Validate):

    _value = RecordVal(
        ('type', ChoiceVal('value', 'date', 'bool'), 'value'),
        ('label', StrVal(), None),
        ('value_key', StrVal()),
        ('read_only', BoolVal(), False),
    )

    _file = RecordVal(
        ('type', ChoiceVal('file')),
        ('label', StrVal(), None),
        ('value_key', StrVal()),
        ('download', URLVal()),
    )

    _option_val = RecordVal(
        ('id', StrVal()),
        ('title', StrVal()),
    )

    _option = RecordVal(
        ('type', ChoiceVal('option')),
        ('label', StrVal(), None),
        ('value_key', StrVal()),
        ('options', SeqVal(_option_val)),
    )

    _autocomplete = RecordVal(
        ('type', ChoiceVal('autocomplete')),
        ('label', StrVal(), None),
        ('value_key', StrVal()),
        ('data', CollectionSpecVal()),
    )

    _list = RecordVal(
        ('type', ChoiceVal('list')),
        ('label', StrVal(), None),
        ('value_key', StrVal()),
        ('fields', SeqVal(info_field_val)),
    )

    _validate = OneOfVal(_autocomplete, _list, _option, _file, _value)

    def __call__(self, value):
        if isinstance(value, InfoField):
            return value
        value = self._validate(value)
        if isinstance(value, self._value.record_type):
            return InfoField(
                label=value.label,
                value_key=value.value_key,
                type=value.type,
                read_only=value.read_only,
                params={})
        elif isinstance(value, self._file.record_type):
            return InfoField(
                label=value.label,
                value_key=value.value_key,
                type=value.type,
                read_only=False,
                params={'download': value.download})
        elif isinstance(value, self._option.record_type):
            return InfoField(
                label=value.label,
                value_key=value.value_key,
                type=value.type,
                read_only=False,
                params={'options': value.options})
        elif isinstance(value, self._autocomplete.record_type):
            return InfoField(
                label=value.label,
                value_key=value.value_key,
                type=value.type,
                read_only=False,
                params={'data': value.data})
        elif isinstance(value, self._list.record_type):
            return InfoField(
                label=value.label,
                value_key=value.value_key,
                type=value.type,
                read_only=False,
                params={'fields': value.fields})
        else:
            raise Error('unknown field type')

info_field_val.set(InfoFieldVal())
