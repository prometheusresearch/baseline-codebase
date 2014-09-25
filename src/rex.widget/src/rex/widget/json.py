"""

    rex.widget.json
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

from jsonpublish.encoder import AdapterRegistry, JSONEncoder
from rex.core import Record

_adapters = AdapterRegistry()


_encoder = JSONEncoder(
    skipkeys=False,
    ensure_ascii=True,
    check_circular=True,
    allow_nan=True,
    indent=None,
    separators=None,
    encoding='utf-8',
    default=None,
    namedtuple_as_object=False,
    tuple_as_array=False,
    adapters=_adapters,
)


register_adapter = _adapters.register_adapter


def dumps(obj):
    return _encoder.encode(obj)


@register_adapter(Record)
def _encode_Record(record):
    return record._asdict()
