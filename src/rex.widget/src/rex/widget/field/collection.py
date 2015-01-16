"""

    rex.widget.field.collection
    ===========================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple
from urlparse import urlparse, parse_qsl
from urllib import urlencode

from rex.core import Error, Validate, RecordVal, MaybeVal, OneOfVal, MapVal
from rex.core import BoolVal, StrVal, IntVal

from ..descriptors import CollectionRead, DataAppend, StateReadWrite
from ..state import State, Reference, unknown, Reset
from ..json_encoder import register_adapter
from ..util import get_validator_for_key
from .data import DataField, DataRef, DataRefVal, DataSpec, product_to_json

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
        ('entity', StrVal(), None),
        ('data', StrVal()),
        ('refs', refs_val, {}),
        ('defer', OneOfVal(StrVal(), BoolVal()), None)
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
        if data.entity is None:
            entity_name = route.replace('/', '__')
        else:
            entity_name = data.entity
        return CollectionSpec(
            entity_name,
            route=route,
            params=params,
            refs=data.refs,
            defer=data.defer,
        )

    def __getitem__(self, key):
        return get_validator_for_key(self.data_spec, key)


class CollectionField(DataField):

    spec_validator = CollectionSpecVal

    INITIAL_PAGINATION = {'top': 100, 'skip': 0}

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

        top_filter = '%s:top' % spec.entity
        skip_filter = '%s:skip' % spec.entity

        if self.paginate:
            query[top_filter] = [query[top_filter][0] + 1]

        data = product_to_json(spec.port.produce(urlencode(query, doseq=True)))

        has_more = False
        if self.paginate:
            has_more = len(data[spec.entity]) == query[top_filter][0]
            data[spec.entity] = data[spec.entity][:-1]
            if query[skip_filter][0] > 0:
                data[spec.entity] = DataAppend(data[spec.entity])

        data.update({
            'id': spec.entity_name,
            'hasMore': has_more,
            'entity': spec.entity,
        })
        return CollectionRead(
            entity=spec.entity_name,
            id=spec.entity_name,
            data=data,
            wrapper='rex-widget/lib/Collection'
        )

    def apply(self, widget, spec):
        if self.paginate:
            pagination_state_id = '%s/%s/pagination' % (widget.widget_id, self.name)
            sort_state_id = '%s/%s/sort' % (widget.widget_id, self.name)

            dependencies = [r.id for refs in spec.refs.values() for r in refs]

            refs = dict(spec.refs)
            refs.update({
                '%s:top' % spec.entity: (DataRef(Reference('%s:top' % pagination_state_id), False),),
                '%s:skip' % spec.entity: (DataRef(Reference('%s:skip' % pagination_state_id), False),),
                '%s:sort' % spec.entity: (DataRef(Reference('%s' % sort_state_id), False),),
            })
            spec = CollectionSpec(
                    spec.entity_name, route=spec.route,
                    params=spec.params, refs=refs, defer=spec.defer)

            props, state = super(CollectionField, self).apply(widget, spec)

            state = state + [
                State(
                    pagination_state_id,
                    widget=widget,
                    computator=self.compute_pagination,
                    validator=MaybeVal(MapVal(StrVal, IntVal)),
                    dependencies=dependencies + [sort_state_id],
                    persistence=State.INVISIBLE,
                    is_writable=True),
                State(
                    sort_state_id,
                    value=_extract_sort_state(spec),
                    widget=widget,
                    validator=MaybeVal(StrVal()),
                    dependencies=dependencies,
                    is_writable=True)
            ]

            props.update({
                '%s_sort' % self.name: StateReadWrite(sort_state_id),
                '%s_pagination' % self.name: StateReadWrite(pagination_state_id),
            })
            return props, state
        else:
            return super(CollectionField, self).apply(widget, spec)


    def compute_pagination(self, widget, state, graph, request):
        if state.value is unknown:
            return Reset(self.INITIAL_PAGINATION)
        if set(d.id for d in state.dependencies) & graph.dirty:
            return Reset(self.INITIAL_PAGINATION)
        return state.value


def _extract_sort_state(spec):
    for k, v in spec.params.items():
        if not k[-5:] == ':sort':
            continue
        _, field_name = k[:-5].split('.', 1)
        return ('+' if v[0] == 'asc' else '-') + field_name
    return unknown
