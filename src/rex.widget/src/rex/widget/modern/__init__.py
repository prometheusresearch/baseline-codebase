"""

    rex.widget.modern
    =================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple

from .dataspec import EntitySpecVal, CollectionSpecVal
from .url import URLVal
from ..json_encoder import register_adapter

from rex.core import Validate, RecordVal, StrVal

InfoField = namedtuple('InfoField', ['label', 'value_key'])

@register_adapter(InfoField)
def _encode_InfoField(field):
    return {'label': field.label, 'valueKey': field.value_key}

class InfoFieldVal(Validate):

    _validate = RecordVal(
        ('label', StrVal(), None),
        ('value_key', StrVal()),
    )

    def __call__(self, value):
        if isinstance(value, InfoField):
            return value
        value = self._validate(value)
        return InfoField(label=value.label, value_key=value.value_key)
