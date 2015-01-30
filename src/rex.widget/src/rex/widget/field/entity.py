"""

    rex.widget.field.entity
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from urlparse import urlparse, parse_qsl
from urllib import urlencode
from logging import getLogger

from rex.core import Error, Validate
from rex.core import RecordVal, OneOfVal, MapVal, StrVal

from ..descriptors import DataRead
from ..json_encoder import register_adapter
from ..state import Reference
from ..util import cached_property, get_validator_for_key, measure_execution_time
from .data import DataField, DataRef, DataSpec, product_to_json

__all__ = ('EntitySpec', 'EntitySpecVal', 'EntityField')


log = getLogger(__name__)


class EntitySpec(DataSpec):
    """ Specification for fetching an entity."""

    ENTITY_ID = 'ENTITY_ID'


class EntitySpecVal(Validate):
    """ Valudator for :class:`EntitySpec`."""

    _validate = RecordVal(
        ('data', StrVal()),
        ('entity_id', StrVal()),
        ('defer', StrVal(), None),
    )

    def __call__(self, data):
        if isinstance(data, EntitySpec):
            return data

        data = self._validate(data)

        parsed = urlparse(data.data)
        if parsed.scheme:
            route = '%s:%s' % (parsed.scheme, parsed.path)
        else:
            route = parsed.path
        params = {
            k: v if isinstance(v, list) else [v]
            for k, v in parse_qsl(parsed.query)
        }

        entity_id = DataRef(ref=Reference(data.entity_id), required=False)

        return EntitySpec(
            route=route,
            refs={EntitySpec.ENTITY_ID: (entity_id,)},
            params=params,
            defer=data.defer
        )

    def __getitem__(self, key):
        return get_validator_for_key(self._validate, key)


class EntityField(DataField):

    spec_validator = EntitySpecVal

    ENTITY_ID = 'ENTITY_ID'

    def produce(self, spec, widget, state, graph, request):
        query = {}

        if spec.params:
            query.update(spec.params)

        entity_id = graph[spec.refs[EntitySpec.ENTITY_ID][0].ref]
        if entity_id is None:
            return None
        query[spec.entity] = entity_id

        encoded_query = urlencode(query, doseq=True)

        message = 'execution time %%f while fetching entity %s?%s' % (
            spec.route, encoded_query.replace('%', '%%'))
        with measure_execution_time(message=message, log=log):
            data = spec.port.produce(encoded_query)
        data = product_to_json(data)

        if len(data[spec.entity]) > 1:
            raise Error('expected 0 or 1 result')
        elif len(data[spec.entity]) == 0:
            data = None
        else:
            data = data[spec.entity][0]

        return DataRead(spec.entity, query[spec.entity][0], data, None)
