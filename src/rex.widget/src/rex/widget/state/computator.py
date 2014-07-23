"""

    rex.widget.state.computator
    ===========================

    :copyright: 2014, Prometheus Research, LLC

"""

import json
import urlparse
import urllib

import htsql.core.cmd.act
from htsql.core.fmt.emit import emit

from rex.db import get_db
from rex.web import route
from rex.core import Error


class StateComputator(object):
    """ Abstract base class for state computators.
    
    Subclasses should implement method :method:`__call__`.
    """

    def __call__(self, value, state, origins=None):
        """ Compute state value.

        :param value: current state value or None
        :param state: application state
        :param origins: a list of state ids from which this computation was
                        originated
        """
        raise NotImplementedError(
            "%s.__call__(state, origins) is not implemented" % \
            self.__class__.__name__)


class InitialValue(StateComputator):
    """ State computator which sets initial value and resets it if one of its
    deps is changed.

    :param initial_value: initial value
    :keyword dependencies: list of state ids this state depends on
    """

    def __init__(self, initial_value, dependencies=None):
        self.initial_value = initial_value
        self.dependencies = set(dependencies) if dependencies is not None else set()

    def __call__(self, value, state, origins=None):
        origins = origins or []

        updated = {
            state_desc.id
                for origin in origins
                if origin in state
                for state_desc in state.dependency_path(origin)
        }

        if not origins or self.dependencies & updated:
            return self.initial_value
        else:
            return value


class UpdatedValue(StateComputator):

    def __init__(self, value, computator):
        self.value = value
        self.computator = computator

    def __call__(self, value, state, origins=None):
        if isinstance(self.computator, StateComputator):
            return self.computator(self.value, state, origins=origins)
        return self.value


class DataComputator(StateComputator):
    """ An abstract base class for state computators which fetch their state
    from database."""

    def __init__(self, url, refs=None, include_meta=False):
        self.url = url
        self.refs = refs or {}
        self.include_meta = include_meta

        self.parsed = urlparse.urlparse(url)
        self.parsed_query = {k: v[0] for k, v
                in urlparse.parse_qs(self.parsed.query)}

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
        product = handler.port.produce(urllib.urlencode(query))
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

        with get_db():
            product = htsql.core.cmd.act.produce(handler.query, query)

        data = product_to_json(product)
        return {"data": data[product.meta.tag], "updating": False}

    def fetch(self, handler, state, origins=None):
        """ Fetch data using ``handler`` in context of the current application
        ``state``.
        """
        raise NotImplementedError(
            "%s.fetch(state) is not implemented" % self.__class__.__name__)

    def execute_handler(self, handler, params):
        """ Execute ``handler`` with given ``params``.
        
        This method is often used by :class:`DataComputator` subclasses to
        implement :method:`fetch(handler, state)`.
        """
        if hasattr(handler, 'port'):
            return self.fetch_port(handler, **params)
        elif hasattr(handler, 'query'):
            return self.fetch_query(handler, **params)
        else:
            raise NotImplementedError(
                    "Unknown data reference: %s" % self.route)

    def __call__(self, value, state, origins=None):
        handler = route(self.route)

        if handler is None:
            raise Error("Invalid data reference:", self.route)

        return self.fetch(handler, state, origins=origins)


class CollectionComputator(DataComputator):

    def fetch(self, handler, state, origins=None):
        params = {name: state.deref(ref) for name, ref in self.refs.items()}
        return self.execute_handler(handler, params)


class EntityComputator(DataComputator):

    def fetch(self, handler, state, origins=None):
        params = {name: state.deref(ref) for name, ref in self.refs.items()}

        if None in params.values():
            return {"data": None, "updating": False}

        data = self.execute_handler(handler, params)
        # XXX: raise error here?
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

    def fetch(self, handler, state, origins=None):
        is_pagination = (
            origins
            and len(origins) == 1
            and origins[0] == self.pagination_state_id
        )
        
        params = {name: state.deref(ref) for name, ref in self.refs.items()}
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
