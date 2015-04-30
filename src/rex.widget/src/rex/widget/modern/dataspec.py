"""

    rex.widget.modern.dataspec
    ==========================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple

from rex.core import Validate, StrVal, RecordVal, MapVal, AnyVal, OneOfVal
from rex.web import url_for, route as resolve_handler_for_route

from ..json_encoder import register_adapter

__all__ = ('CollectionSpec', 'EntitySpec', 'CollectionSpecVal', 'EntitySpecVal')


DataSpec = namedtuple(
    'DataSpec',
    ['route', 'params'])


KIND_PORT = 'port'
KIND_QUERY = 'query'
KIND_HANDLER = 'handler'


class CollectionSpec(DataSpec):
    """ A specification for a collection dataset."""

    __slots__ = ()


class EntitySpec(DataSpec):
    """ A specification for an entity dataset."""

    __slots__ = ()


def _encode_DataSpec(value, request):
    route, params = value
    url = url_for(request, route)
    if isinstance(value, CollectionSpec):
        tag = 'collection'
    elif isinstance(value, EntitySpec):
        tag = 'entity'
    else:
        raise ValueError(
            'Unknown type of a dataspec provided, only EntitySpec and '
            'CollectionSpec are supported at the moment.')
    handler = resolve_handler_for_route(route)
    if hasattr(handler, 'port'):
        kind = KIND_PORT
    elif hasattr(handler, 'query'):
        kind = KIND_QUERY
    else:
        kind = KIND_HANDLER
    return {'__dataspec__': (tag, url, params, kind)}


register_adapter(EntitySpec)(_encode_DataSpec)
register_adapter(CollectionSpec)(_encode_DataSpec)


class DataSpecVal(Validate):
    """ Base class for validators for data specifications."""

    spec_class = NotImplemented

    _validate_shortcut = StrVal()
    _validate_full = RecordVal(
        ('route', StrVal()),
        ('params', MapVal(StrVal(), AnyVal())),
    )
    _validate = OneOfVal(_validate_shortcut, _validate_full)

    def __call__(self, value):
        if isinstance(value, self.spec_class):
            return value
        value = self._validate(value)
        if isinstance(value, basestring):
            value = self._validate_full.record_type(route=value, params={})
        return self.spec_class(route=value.route, params=value.params)


class CollectionSpecVal(DataSpecVal):
    """ Validator for :class:`CollectionSpec` values."""

    spec_class = CollectionSpec


class EntitySpecVal(DataSpecVal):
    """ Validator for :class:`EntitySpec` values."""

    spec_class = EntitySpec
