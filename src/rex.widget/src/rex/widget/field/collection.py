"""

    rex.widget.field.collection
    ===========================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple
from urlparse import urlparse, parse_qsl
from urllib import urlencode

from rex.core import Error, Validate
from rex.core import RecordVal, RecordField, OneOfVal, MapVal, BoolVal, StrVal

from ..descriptors import DataRead
from ..json_encoder import register_adapter
from .data import DataField, DataRefVal, DataSpec, product_to_json

__all__ = ('CollectionSpec', 'CollectionSpecVal', 'CollectionField')



class CollectionSpec(DataSpec):
    """ Collection specification.

    :attr id: Identifier
    :attr route: Route specification
    :attr query: HTSQL query
    :attr params: Parameters
    :attr refs: Collection references
    :attr defer: Defer group
    """

    def __init__(self, entity_name, route=None, params=None, refs=None, defer=None):
        super(CollectionSpec, self).__init__(
            route,
            defer=defer,
            refs=refs,
            params=params,
        )
        self.entity_name = entity_name

    def __repr__(self):
        return (
            'CollectionSpec('
            'entity_name=%r, route=%r, params=%r, '
            'refs=%r, defer=%r)' % (
            self.entity_name, self.route, self.params, self.refs, self.defer)
        )


class CollectionSpecVal(Validate):
    """ Collection specification value.

    There are two forms are allowed. One is the full form::

        data:
          data: pkg:/path
          refs:
            param: widget/state

    and another one is shorthand::

        data: pkg:/path

    which gets expanded into::

        data:
          data: pkg:/path
          refs: {}

    """

    refs_val = MapVal(StrVal(), DataRefVal())

    data_spec = RecordVal(
        RecordField('entity', StrVal()),
        RecordField('data', StrVal()),
        RecordField('refs', refs_val, default={}),
        RecordField('defer', OneOfVal(StrVal(), BoolVal()), default=None)
    )

    data_spec_with_shorthand = OneOfVal(StrVal(), data_spec)

    def __call__(self, data):
        if isinstance(data, CollectionSpec):
            return data
        data = self.data_spec_with_shorthand(data)
        if isinstance(data, basestring):
            data = self.data_spec({'data': data})

        parsed = urlparse(data.data)
        route = '%s:%s' % (parsed.scheme, parsed.path) if parsed.scheme else parsed.path
        params = {k: v if isinstance(v, list) else [v]
                for k, v in parse_qsl(parsed.query)}
        return CollectionSpec(
            data.entity,
            route=route,
            params=params,
            refs=data.refs,
            defer=data.defer,
        )


class CollectionField(DataField):

    spec_validator = CollectionSpecVal

    def __init__(self, include_meta=False, paginate=False, default=NotImplemented, doc=None,
            manager=None, name=None):
        super(CollectionField, self).__init__(
            include_meta=include_meta,
            default=default,
            doc=doc,
            manager=manager,
            name=name,
        )
        self.paginate = paginate

    def produce(self, spec, widget, state, graph, request):
        query = {}

        if spec.params:
            query.update(spec.params)

        # resolve refs to params
        for name, refs in spec.refs.items():
            for ref in refs:
                value = graph[ref.ref]
                if value is None:
                    if ref.required:
                        return None
                    else:
                        continue
                query.setdefault(name, []).append(value)

        data = product_to_json(spec.port.produce(urlencode(query, doseq=True)))
        data.update({
            'id': spec.entity_name,
            'hasMore': False,
            'entity': spec.entity,
        })
        return DataRead(spec.entity_name, spec.entity_name, data, wrapper='rex-widget/lib/Collection')
