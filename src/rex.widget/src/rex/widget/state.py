#
# Copyright (c) 2014, Prometheus Research, LLC
#

import re
import json
import urlparse
import urllib
from collections import namedtuple, MutableMapping

from htsql.core.fmt.emit import emit
from rex.db import get_db
from rex.web import route
from rex.core import Validate


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
        return self.storage[id]

    def __setitem__(self, id, value):
        self.storage[id] = value

    def __delitem__(self, id):
        del self.storage[id]


def fetch_state(state):
    """ Return a new application state with resolved data references."""

    result = ApplicationState()

    for item in state.values():
        fetch_state_item(item, state, result)

    return result


def fetch_state_update(state, origin):
    """ Return a partial application with resolved data references originated
    from a state with ``origin`` id."""
    # we use context to store fetched state but only need to return state along
    # the dependency path
    result = ApplicationState()
    context = ApplicationState()

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


class DataReference(object):

    interpolation_re = re.compile(r'^\${([a-zA-Z_\.0-9]+)}$')

    def __init__(self, reference):
        self.reference = urlparse.urlparse(reference)
        self.query = {}
        self.depenendecy_to_query = {}
        self.dependencies = []

        for k, v in self._parse_qs(self.reference.query).items():
            if self.interpolation_re.match(v):
                dep = v[2:-1] # strip '${' and '}'
                self.depenendecy_to_query[dep] = k
                self.dependencies.append(dep)
            else:
                self.query[k] = v

    def resolve_port(self, handler, query):
        port = handler.port
        return self._first_product_row(port.produce(urllib.urlencode(query)))

    def _first_product_row(self, product):
        """ Return a first row of a product."""
        with get_db():
            field_name = product.meta.domain.fields[0].tag
            data = ''.join(emit('application/json', product))
            data = json.loads(data)
            return data[field_name]

    def _parse_qs(self, s):
        return {k: v[0] for k, v in urlparse.parse_qs(s).items()}

    def __call__(self, state):

        query = dict(self.query)

        for dep in self.dependencies:
            value = state[dep].value
            if value is not None:
                query[self.depenendecy_to_query[dep]] = value

        handler = route(self.reference.path)

        if handler is None:
            raise Error("Invalid data:", reference)

        if hasattr(handler, 'port'):
            return self.resolve_port(handler, query)
        else:
            raise NotImplementedError(
                    "Unknown data reference: %s" % reference)


class DataReferenceVal(Validate):

    def __call__(self, data):
        # FIXME: validate!
        return DataReference(data)


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
