"""

    rex.widget.modern.info_field
    ============================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple
from rex.core import Validate, RecordVal, StrVal, ChoiceVal, OneOfVal, SeqVal
from ..json_encoder import register_adapter
from .url import URLVal

__all__ = ('InfoFieldVal',)


InfoField = namedtuple('InfoField', ['label', 'value_key', 'type', 'params'])


@register_adapter(InfoField)
def _encode_InfoField(field):
    return {
        'label': field.label,
        'valueKey': field.value_key,
        'type': field.type,
        'params': field.params
    }


class InfoFieldVal(Validate):

    _value = RecordVal(
        ('type', ChoiceVal('value', 'date', 'bool'), 'value'),
        ('label', StrVal(), None),
        ('value_key', StrVal()),
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

    _validate = OneOfVal(_option, _file, _value)

    def __call__(self, value):
        if isinstance(value, InfoField):
            return value
        value = self._validate(value)
        if isinstance(value, self._value.record_type):
            return InfoField(
                label=value.label,
                value_key=value.value_key,
                type=value.type,
                params={})
        elif isinstance(value, self._file.record_type):
            return InfoField(
                label=value.label,
                value_key=value.value_key,
                type=value.type,
                params={'download': value.download})
        elif isinstance(value, self._option.record_type):
            return InfoField(
                label=value.label,
                value_key=value.value_key,
                type=value.type,
                params={'options': value.options})
