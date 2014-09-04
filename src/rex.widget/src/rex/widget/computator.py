"""

    rex.widget.state.computator
    ===========================

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

from collections import namedtuple
import json
import urlparse
import urllib

import htsql.core.cmd.act
from htsql.core.fmt.emit import emit

from rex.db import get_db
from rex.web import route
from rex.core import Error

from .logging import getLogger
from .state import Reset, unknown
from .util import measure_execution_time


log = getLogger(__name__)


class InitialValue(object):

    def __init__(self, initial_value, reset_on_changes=False):
        self.initial_value = initial_value
        self.reset_on_changes = reset_on_changes

    def __call__(self, widget, state, graph, dirty=None, is_active=True):
        if state.value is unknown:
            return Reset(self.initial_value)
        if self.reset_on_changes and (set(d.id for d in state.dependencies) & dirty):
            return Reset(self.initial_value)
        return state.value


_Data = namedtuple('Data', ['data', 'meta', 'has_more'])

class Data(_Data):

    __slots__ = ()

    def __new__(cls, data, meta=None, has_more=False):
        return _Data.__new__(cls, data=data, meta=meta, has_more=False)

    def get(self, name, default=None):
        if name in self._fields:
            return self[name]
        return default

    def __getitem__(self, name):
        # Python weirdness, __getattr__ is implemented in terms of __getitem__
        if isinstance(name, int):
            return _Data.__getitem__(self, name)
        if name in self._fields:
            return getattr(self, name)
        else:
            raise KeyError(name)


Append = namedtuple('Append', ['data'])


def map_param(param):
    # XXX: 0 == False, thanks Python
    if param is False or param == 'false':
        return ''
    if param is True:
        return 'true'
    return param


def urlencode(query):
    params = {}
    for k, v in query.items():
        v = [map_param(x) for x in v if x is not None]
        if v:
            params[k] = v
    return urllib.urlencode(params, doseq=True)


class DataComputator(object):
    """ An abstract base class for state computators which fetch their state
    from database."""

    inactive_value = NotImplemented

    def __init__(self, url, refs=None, include_meta=False):
        self.url = url
        self.refs = refs or {}
        self.include_meta = include_meta

        self.parsed = urlparse.urlparse(url)
        self.parsed_query = {k: v if isinstance(v, list) else [v]
                for k, v in urlparse.parse_qsl(self.parsed.query)}

    @property
    def route(self):
        if self.parsed.scheme:
            return "%s:%s" % (self.parsed.scheme, self.parsed.path)
        else:
            return self.parsed.path

    def fetch_port(self, handler, **params):
        query = dict(self.parsed_query)
        query.update(params)
        query = urlencode(query)

        log.debug('fetching port: %s?%s', self.parsed.path, query)

        with measure_execution_time(log=log):
            product = handler.port.produce(query)
        data = product_to_json(product)
        data = data[product.meta.domain.fields[0].tag]
        if self.include_meta:
            meta = product_meta_to_json(handler.port.describe())
            meta = meta["domain"]["fields"][0]
            return Data(data, meta=meta)
            return {"data": data, "meta": meta}
        else:
            return Data(data)

    def fetch_query(self, handler, **params):
        query = dict(handler.parameters)
        query.update(self.parsed_query)
        query.update(params)
        for (k, v) in query.items():
            v = v[0] if isinstance(v, list) else v
            if v == False:
                v = ''
            if v is None:
                v = ''
            query[k] = v

        log.debug(
            'fetching query: %s?%s',
            self.parsed.path,
            urllib.urlencode(query, doseq=True)
        )

        with measure_execution_time(log=log), get_db():
            product = htsql.core.cmd.act.produce(handler.query, **query)

        data = product_to_json(product)
        data = data[product.meta.tag]

        if self.include_meta:
            meta = product_meta_to_json(product)
            return Data(data, meta=meta)
        else:
            return Data(data)


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

    def __call__(self, widget, state, graph, dirty=None, is_active=True):
        if not is_active or state.defer is not None:
            return self.inactive_value
        handler = route(self.route)
        if handler is None:
            raise Error("Invalid data reference:", self.route)
        return self.fetch(handler, graph, dirty)


class CollectionComputator(DataComputator):

    inactive_value = Data([])

    def fetch(self, handler, graph, dirty=None):
        params = {}
        for name, refs in self.refs.items():
            for ref in refs:
                value = graph[ref]
                if value is None:
                    continue
                params.setdefault(name, []).append(value)
        return self.execute_handler(handler, params)


class EntityComputator(DataComputator):

    inactive_value = Data(None)
    no_value = Data(None)

    def fetch(self, handler, graph, dirty=None):
        params = {}
        for name, refs in self.refs.items():
            for ref in refs:
                value = graph[ref]
                if value is None:
                    return self.no_value
                params.setdefault(name, []).append(value)

        data = self.execute_handler(handler, params)

        if isinstance(data.data, list):
            if len(data.data) == 0:
                data = self.no_value
            else:
                data = data._replace(data=data.data[0])

        return data


class PaginatedCollectionComputator(DataComputator):

    inactive_value = Data([], has_more=False)

    def __init__(self, pagination_state_id, url, refs=None, include_meta=False):
        super(PaginatedCollectionComputator, self).__init__(
                url, refs=refs, include_meta=include_meta)
        self.pagination_state_id = pagination_state_id

    def fetch_port(self, handler, top=None, skip=None, sort=None, **params):
        assert top is not None
        assert skip is not None

        # Ports require us to specify entity name in top/skip constraints
        entity_name = handler.port.tree.items()[0][0]
        params["%s:top" % entity_name] = top
        params["%s:skip" % entity_name] = skip

        if sort:
            sort_field, sort_direction = parse_sort_spec(sort[0])
            if sort_field:
                params["%s.%s:sort" % (entity_name, sort_field)] = [sort_direction]

        return super(PaginatedCollectionComputator, self).fetch_port(
            handler,
            **params)

    def fetch(self, handler, graph, dirty):
        is_pagination = (
            dirty
            and len(dirty) == 1
            and list(dirty)[0] == self.pagination_state_id
        )

        params = {}
        for name, refs in self.refs.items():
            for ref in refs:
                value = graph[ref]
                if value is None:
                    continue
                params.setdefault(name, []).append(value)

        # patch "top" so we can see if we have more data than we need now
        params["top"] = [params["top"][0] + 1]

        data = self.execute_handler(handler, params)

        if len(data.data) == params["top"][0]:
            data = data._replace(
                data=data.data[:-1],
                has_more=True
            )
        else:
            data = data._replace(has_more=False)

        if is_pagination:
            data = data._replace(data=Append(data.data))

        return data


def parse_sort_spec(spec):
    if spec and (spec[0] == '+' or spec[0] == '-'):
        return (spec[1:], 'asc' if spec[0] == '+' else 'desc')
    else:
        return (spec, 'asc')


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
