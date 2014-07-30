"""

    rex.widget.state.computator
    ===========================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple
import json
import urlparse
import urllib

import htsql.core.cmd.act
from htsql.core.fmt.emit import emit

from rex.db import get_db
from rex.web import route
from rex.core import Error

from ..logging import getLogger
from .graph import Reset, unknown
from .reference import parse_ref


log = getLogger(__name__)


class InitialValue(object):

    def __init__(self, initial_value, reset_on_changes=False):
        self.initial_value = initial_value
        self.reset_on_changes = reset_on_changes

    def __call__(self, widget, state, graph, dirty=None):
        if state.value is unknown:
            return Reset(self.initial_value)
        if self.reset_on_changes and (set(d.id for d in state.dependencies) & dirty):
            return Reset(self.initial_value)
        return state.value


class InRangeValue(object):

    def __init__(self, initial_value, source=None):
        self.initial_value = initial_value
        self.source = source

    def __call__(self, widget, state, graph, dirty=None):
        source = state.id.split('.')[0] + '.' + self.source

        if state.value is unknown:
            return Reset(self.initial_value)

        # if data source is marked as dirty we need to check if current value is
        # still valid and reset it otherwise
        if state.value is not None and source in dirty:
            options = [option['id'] for option in graph[source]["data"]]
            if state.value not in options:
                return Reset(self.initial_value)

        return state.value


class AggregatedValue(object):

    def __init__(self, aggregation):
        self.aggregation = aggregation

    def initial_value(self, graph):
        return {k: graph[dep] for k, dep in self.aggregation.items()}

    def __call__(self, widget, state, graph, dirty=None):
        if dirty is None:
            return self.initial_value(graph)

        if set(self.aggregation.values()) & dirty:
            return self.initial_value(graph)

        return state.value


class DataComputator(object):
    """ An abstract base class for state computators which fetch their state
    from database."""

    def __init__(self, url, refs=None, include_meta=False):
        self.url = url
        self.refs = refs or {}
        self.include_meta = include_meta

        self.parsed = urlparse.urlparse(url)
        self.parsed_query = {
                k: v[0] for k, v
                in urlparse.parse_qs(self.parsed.query).items()}

    @property
    def route(self):
        if self.parsed.scheme:
            return "%s:%s" % (self.parsed.scheme, self.parsed.path)
        else:
            return self.parsed.path

    def fetch_port(self, handler, **params):
        query = dict(self.parsed_query)
        query.update(params)
        query = {k: v for k, v in query.items() if v is not None}
        query = urllib.urlencode(query)

        log.info('fetching port: %s?%s', self.url, query)

        product = handler.port.produce(query)
        data = product_to_json(product)
        data = data[product.meta.domain.fields[0].tag]
        if self.include_meta:
            meta = product_meta_to_json(handler.port.describe())
            return {"data": data, "meta": meta, "updating": False}
        else:
            return {"data": data, "updating": False}

    def fetch_query(self, handler, **params):
        query = dict(self.parsed_query)

        for k in self.refs:
            query[k] = ''

        query.update(params)

        log.info('fetching query: %s?%s', self.url, urllib.urlencode(query))

        with get_db():
            product = htsql.core.cmd.act.produce(handler.query, query)

        data = product_to_json(product)
        return {
            "data": data[product.meta.tag],
            "updating": False
        }

    def fetch(self, handler, graph, dirty=None):
        """ Fetch data using ``handler`` in context of the current application
        state ``graph``.
        """
        raise NotImplementedError(
            "%s.fetch(handler, graph, dirty=None) is not implemented" % self.__class__.__name__)

    def execute_handler(self, handler, params):
        """ Execute ``handler`` with given ``params``.

        This method is often used by :class:`DataComputator` subclasses to
        implement :method:`fetch`.
        """
        if hasattr(handler, 'port'):
            return self.fetch_port(handler, **params)
        elif hasattr(handler, 'query'):
            return self.fetch_query(handler, **params)
        else:
            raise NotImplementedError(
                    "Unknown data reference: %s" % self.route)

    def __call__(self, widget, state, graph, dirty=None):
        handler = route(self.route)

        if handler is None:
            raise Error("Invalid data reference:", self.route)

        return self.fetch(handler, graph, dirty)


class CollectionComputator(DataComputator):

    def fetch(self, handler, graph, dirty):
        params = {name: graph[ref] for name, ref in self.refs.items()}
        return self.execute_handler(handler, params)


class EntityComputator(DataComputator):

    def fetch(self, handler, graph, dirty):
        params = {name: graph[ref] for name, ref in self.refs.items()}

        if None in params.values():
            return {"data": None, "updating": False}

        data = self.execute_handler(handler, params)

        if isinstance(data["data"], list):
            if len(data["data"]) == 0:
                data["data"] = None
            else:
                data["data"] = data["data"][0]

        return data


class PaginatedCollectionComputator(DataComputator):

    def __init__(self, pagination_state_id, url, refs=None, include_meta=False):
        super(PaginatedCollectionComputator, self).__init__(
                url, refs=refs, include_meta=include_meta)
        self.pagination_state_id = pagination_state_id

    def fetch_port(self, handler, top=None, skip=None, **params):
        assert top is not None
        assert skip is not None

        # Ports require us to specify entity name in top/skip constraints
        entity_name = handler.port.tree.items()[0][0]
        params["%s:top" % entity_name] = top
        params["%s:skip" % entity_name] = skip

        return super(PaginatedCollectionComputator, self).fetch_port(
                handler,
                **params)

    def fetch(self, handler, graph, dirty):
        is_pagination = (
            dirty
            and len(dirty) == 1
            and list(dirty)[0] == self.pagination_state_id
        )

        params = {name: graph[ref] for name, ref in self.refs.items()}
        params["top"] = params["top"] + 1
        data = self.execute_handler(handler, params)

        if len(data["data"]) == params["top"]:
            data["data"] = data["data"][:-1]
            data["hasMore"] = True
        else:
            data["hasMore"] = False

        if is_pagination:
            data["data"] = {"__append__": data["data"]}

        return data


def product_to_json(product):
    """ Convert product to JSON serializeable object.

    :param product: Product to convert
    :type product: :class:`htsql.code.domain.Product`
    """
    # FIXME: we should remove unparse/parse phase
    with get_db():
        data = ''.join(emit('application/json', product))
    data = json.loads(data)
    return data


def product_meta_to_json(product):
    """ Convert product's meta to JSON serializeable object.

    :param product: Product to convert meta of
    :type product: :class:`htsql.code.domain.Product`
    """
    # FIXME: we should remove unparse/parse phase
    with get_db():
        data = ''.join(emit('x-htsql/raw', product))
    data = json.loads(data)
    return data["meta"]
