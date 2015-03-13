"""

    rex.widget.json_encoder
    =======================

    JSON encoder used by Rex Widget to encode custom types to JSON.

    To make your own custom type JSON encodable::

        from rex.widget.json_encoder import register_adapter

        @register_adapter(User)
        def _encode_User(user):
            return {
                'firstName': user.first_name,
                'lastName': user.last_name
            }

    After that Rex Widget will be able to encode values of type ``User`` into
    JSON.

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

import inspect

from jsonpublish.encoder import AdapterRegistry, JSONEncoder
from rex.core import Record
from .local import context, get_request

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

_debug_encoder = JSONEncoder(
    skipkeys=False,
    ensure_ascii=True,
    check_circular=True,
    allow_nan=True,
    indent=2,
    separators=None,
    encoding='utf-8',
    default=None,
    namedtuple_as_object=False,
    tuple_as_array=False,
    adapters=_adapters,
)


def register_adapter(*type):
    _registration = _adapters.register_adapter(*type)
    def registration(encoder):
        argspec = inspect.getargspec(encoder)
        need_request = len(argspec.args) > 1 and argspec.args[1] == 'request'
        def _encoder(value):
            if need_request:
                return encoder(value, get_request())
            else:
                return encoder(value)
        return _registration(_encoder)
    return registration


def dumps(obj, request, debug=False):
    encoder = _encoder if not debug else _debug_encoder
    with context(request):
        return encoder.encode(obj)

@register_adapter(Record)
def _encode_Record(record):
    return record._asdict()


@register_adapter(set)
def _encode_set(value):
    return list(value)


@register_adapter(tuple)
def _encode_set(value):
    return list(value)
