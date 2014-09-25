"""

    rex.widget.field.paginated_collection
    =====================================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import IntVal, StrVal, MapVal, MaybeVal
from ..state import unknown, State, Reference, Reset
from .data import DataField, Data, Append


class PaginatedCollectionField(DataField):

    class computator(DataField.computator):

        inactive_value = Data([], has_more=False)

        def fetch(self, handler, spec, graph): # pylint: disable=arguments-differ
            is_pagination = (
                graph.dirty
                and len(graph.dirty) == 1
                and list(graph.dirty)[0] == self.params['pagination_state_id']
            )

            params = {}
            for name, refs in spec.refs.items():
                for ref in refs:
                    value = graph[ref]
                    if value is None:
                        continue
                    params.setdefault(name, []).append(value)

            # patch 'top' so we can see if we have more data than we need now
            params['top'] = [params['top'][0] + 1]

            data = self.execute(handler, spec, **params)

            if len(data.data) == params['top'][0]:
                data = data._replace( # pylint: disable=protected-access
                    data=data.data[:-1],
                    has_more=True
                )
            else:
                data = data._replace(has_more=False) # pylint: disable=protected-access

            if is_pagination:
                data = data._replace(data=Append(data.data)) # pylint: disable=protected-access

            return data

        def execute_port(self, handler, spec,
                         top=None, skip=None, sort=None, **params):
            assert top is not None
            assert skip is not None

            # Ports require us to specify entity name in top/skip constraints
            entity_name = handler.port.tree.items()[0][0]
            params['%s:top' % entity_name] = top
            params['%s:skip' % entity_name] = skip

            if sort:
                sort_field, sort_direction = _parse_sort_spec(sort[0])
                sort_field = '%s.%s:sort' % (entity_name, sort_field)
                if sort_field:
                    params[sort_field] = [sort_direction]

            return DataField.computator.execute_port(
                self, handler, spec, **params)

    def describe(self, name, spec, widget):
        if spec is None:
            return []

        state_id = '%s/%s' % (widget.id, name)
        pagination_state_id = '%s/%s/pagination' % (widget.id, name)
        sort_state_id = '%s/%s/sort' % (widget.id, name)

        dependencies = [r.id for refs in spec.refs.values() for r in refs]

        refs = dict(spec.refs)
        refs.update({
            'top': (Reference('%s:top' % pagination_state_id),),
            'skip': (Reference('%s:skip' % pagination_state_id),),
            'sort': (Reference('%s' % sort_state_id),),
        })
        spec = spec._replace(refs=refs)

        return [
            (
                name,
                State(
                    state_id,
                    widget=widget,
                    computator=self.computator(
                        spec,
                        self,
                        pagination_state_id=pagination_state_id),
                    dependencies=dependencies + [
                        pagination_state_id,
                        sort_state_id],
                    is_writable=False,
                    defer=spec.defer)
            ),
            (
                '%sPagination' % name,
                State(
                    pagination_state_id,
                    widget=widget,
                    computator=self.compute_pagination,
                    validator=MaybeVal(MapVal(StrVal, IntVal)),
                    dependencies=dependencies + [sort_state_id],
                    persistence=State.INVISIBLE,
                    is_writable=True)
            ),
            (
                '%sSort' % name,
                State(
                    sort_state_id,
                    value=_extract_sort_state(spec),
                    widget=widget,
                    validator=MaybeVal(StrVal()),
                    dependencies=dependencies,
                    is_writable=True)
            ),
        ]

    def compute_pagination(self, widget, state, graph, request): # pylint: disable=no-self-use,unused-argument
        if state.value is unknown:
            return Reset({'top': 100, 'skip': 0})
        if set(d.id for d in state.dependencies) & graph.dirty:
            return Reset({'top': 100, 'skip': 0})
        return state.value


def _extract_sort_state(spec):
    for k, v in spec.params.items():
        if not k[-5:] == ':sort':
            continue
        _, field_name = k[:-5].split('.', 1)
        return ('+' if v[0] == 'asc' else '-') + field_name
    return unknown


def _parse_sort_spec(spec):
    if spec and (spec[0] == '+' or spec[0] == '-'):
        return (spec[1:], 'asc' if spec[0] == '+' else 'desc')
    else:
        return (spec, 'asc')
