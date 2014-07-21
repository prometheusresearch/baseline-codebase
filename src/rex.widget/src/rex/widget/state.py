#
# Copyright (c) 2014, Prometheus Research, LLC
#

import re
import json
import urlparse
import urllib
from collections import namedtuple, MutableMapping

import htsql.core.cmd.act
from htsql.core.fmt.emit import emit
from rex.db import get_db
from rex.web import route
from rex.core import Validate, Error


StateDescriptor = namedtuple(
        'StateDescriptor',
        ['id', 'value', 'dependencies', 'remote'])


class ApplicationState(MutableMapping):
    """ Represents application state as a graph of interdependent values."""

    def __init__(self):
        self.storage = {}
        self.dependents = {}

    def add(self, id, value, dependencies=None, remote=False):
        state = StateDescriptor(id, value, dependencies or [], remote)
        self._add(state)

    def update(self, app_state):
        for state in app_state.storage.values():
            self._add(state)

    def _add(self, state):
        # TODO: check for circular dependencies
        self.storage[state.id] = state
        for dep in state.dependencies:
            self.dependents.setdefault(dep, []).append(state.id)

    def dependency_path(self, from_id):
        for state_id in self.dependents.get(from_id, []):
            yield self.storage[state_id]
            for dep in self.dependency_path(state_id):
                yield dep

    def __iter__(self):
        return iter(self.storage)

    def __len__(self):
        return len(self.storage)

    def __getitem__(self, id):
        if ':' in id:
            id = id.split(':', 1)[0]
        return self.storage[id]

    def __setitem__(self, id, value):
        self.storage[id] = value

    def __delitem__(self, id):
        del self.storage[id]

    def deref(self, ref):
        value = self.storage[ref.id].value
        for part in ref.path:
            value = value[part]
        return value


def fetch_state(state):
    """ Return a new application state with resolved data references."""

    result = ApplicationState()

    for item in state.values():
        fetch_state_item(item, state, result)

    return result


def fetch_state_update(state, origins):
    """ Return a partial application with resolved data references originated
    from a state with ``origins`` ids."""
    # we use context to store fetched state but only need to return state along
    # the dependency path
    result = ApplicationState()
    context = ApplicationState()

    for origin in origins:
        for item in state.dependency_path(origin):
            fetch_state_item(item, state, context)
            result[item.id] = context[item.id]

    return result


def fetch_state_item(item, state_in, state_out):
    if not item.id in state_out:
        if isinstance(item.value, DataReference):
            for dep in item.dependencies:
                fetch_state_item(state_in[dep], state_in, state_out)

            value = {
                "data": item.value(state_out),
                "updating": False
            }
            state_out[item.id] = item._replace(value=value)
        else:
            state_out[item.id] = state_in[item.id]


def product_to_json(product):
    with get_db():
        data = ''.join(emit('application/json', product))
    data = json.loads(data)
    return data


class DataReference(object):

    def __init__(self, url, refs):
        self.url = url
        self.refs = refs
        self.dependencies = [r.id for r in refs.values()]
        self.parsed = urlparse.urlparse(url)
        self.parsed_query = {k: v[0] for k, v
                in urlparse.parse_qs(self.parsed.query)}

    @property
    def route_reference(self):
        if self.parsed.scheme:
            return "%s:%s" % (self.parsed.scheme, self.parsed.path)
        else:
            return self.parsed.path

    def resolve_port(self, handler, params):
        query = dict(self.parsed_query)
        query.update(params)
        query = {k: v for k, v in query.items() if v is not None}
        product = handler.port.produce(urllib.urlencode(query))
        data = product_to_json(product)
        return data[product.meta.domain.fields[0].tag]

    def resolve_query(self, handler, params):
        query = dict(self.parsed_query)

        for k in self.refs:
            query[k] = ''

        query.update(params)

        with get_db():
            product = htsql.core.cmd.act.produce(handler.query, query)

        data = product_to_json(product)
        return data[product.meta.tag]

    def fetch(self, handler, state):
        """ Fetch data using ``handler`` in context of the current application
        ``state``.
        """
        raise NotImplementedError(
            "%s.fetch(state) is not implemented" % self.__class__.__name__)

    def execute_handler(self, handler, params):
        """ Execute ``handler`` with given ``params``.
        
        This method is often used by :class:`DataReference` subclasses to
        implement :method:`fetch(handler, state)`.
        """
        if hasattr(handler, 'port'):
            return self.resolve_port(handler, params)
        elif hasattr(handler, 'query'):
            return self.resolve_query(handler, params)
        else:
            raise NotImplementedError(
                    "Unknown data reference: %s" % self.route_reference)

    def __str__(self):
        return "%s(%s, %s)" % (
                self.__class__.__name__,
                self.url,
                self.refs)

    __repr__ = __str__

    def __call__(self, state):
        handler = route(self.route_reference)

        if handler is None:
            raise Error("Invalid data reference:", self.route_reference)

        return self.fetch(handler, state)


Reference = namedtuple('Reference', ['id', 'path'])


def parse_ref(ref):
    if ':' in ref:
        id, path = ref.split(':', 1)
        return Reference(id, path.split('.'))
    else:
        return Reference(ref, [])


class DataReferenceVal(Validate):

    data_reference_factory = NotImplemented

    def __call__(self, data):
        if isinstance(data, basestring):
            return self.data_reference_factory(data, refs={})
        elif isinstance(data, dict):
            if not "url" in data:
                raise Error(
                    "invalid data reference: expected an URL or "
                    "{url: ..., refs: ...} mapping")
            refs = {name: parse_ref(ref)
                    for name, ref
                    in data.get("refs", {}).items()}
            return self.data_reference_factory(data["url"], refs=refs)
        else:
            raise Error(
                "invalid data reference: expected an URL or "
                "{url: ..., refs: ...} mapping")


class CollectionReference(DataReference):

    def fetch(self, handler, state):
        params = {name: state.deref(ref) for name, ref in self.refs.items()}
        return self.execute_handler(handler, params)


class CollectionReferenceVal(DataReferenceVal):

    data_reference_factory = CollectionReference


class PaginatedCollectionReference(DataReference):
    pass


class PaginatedCollectionReferenceVal(DataReferenceVal):

    data_reference_factory = PaginatedCollectionReference


class EntityReference(DataReference):
    pass


class EntityReferenceVal(DataReferenceVal):

    data_reference_factory = EntityReference


class State(object):

    def __init__(self, initial):
        self.initial = initial


class StateVal(Validate):

    def __init__(self, validate):
        if isinstance(validate, type):
            validate = validate()
        self.validate = validate

    def __call__(self, data):
        return State(self.validate(data))
