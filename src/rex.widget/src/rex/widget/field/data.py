"""

    rex.widget.field.data
    =====================

    :copyright: 2014, Prometheus Research, LLC

"""

import re
import urllib
import json
from urlparse import urlparse, parse_qsl
from collections import namedtuple

import htsql.core.cmd.act
from htsql.core.fmt.emit import emit
from rex.core import (
    Validate, Error,
    OneOfVal, RecordVal, RecordField, SeqVal, MapVal,
    StrVal, BoolVal)
from rex.web import route
from rex.db import get_db

from ..json import register_adapter
from ..util import measure_execution_time
from ..logging import getLogger
from ..state import Reference, State
from .base import StatefulField


log = getLogger(__name__)


_Data = namedtuple('Data', ['id', 'data', 'meta', 'has_more'])

class Data(_Data):
    """ Container for data."""

    __slots__ = ()

    def __new__(cls, data, meta=None, has_more=False, id=None): # pylint: disable=redefined-builtin
        return _Data.__new__(
            cls, id=id, data=data, meta=meta, has_more=has_more)

    def get(self, name, default=None):
        if name in self._fields: # pylint: disable=no-member
            return self[name]
        return default

    def __getitem__(self, name):
        # Python weirdness, __getattr__ is implemented in terms of __getitem__
        if isinstance(name, int):
            return _Data.__getitem__(self, name)
        if name in self._fields: # pylint: disable=no-member
            return getattr(self, name)
        else:
            raise KeyError(name)

@register_adapter(Data)
def _encode_Data(data):
    return {
        'id': data.id,
        'data': data.data,
        'meta': data.meta,
        'hasMore': data.has_more
    }


Append = namedtuple('Append', ['data'])

@register_adapter(Append)
def _encode_Append(directive):
    return {'__append__': directive.data}


DataSpec = namedtuple('DataSpec', ['route', 'query', 'params', 'refs', 'defer'])


class DataSpecVal(Validate):
    """ Data specification value.

    There are two forms are allowed. One is the full form::

        data:
          url: pkg:/url
          refs:
            param: widget/state

    and another one is shorthand::

        data: pkg:/url

    which gets expanded into::

        data:
          url: pkg:/url
          refs: {}

    """

    IS_ROUTE_RE = re.compile('^[a-zA-Z_][a-zA-Z_\.0-0]*:+')

    refs_val = MapVal(StrVal(), OneOfVal(StrVal(), SeqVal(StrVal())))

    data_spec = RecordVal(
        RecordField('url', StrVal()),
        RecordField('refs', refs_val, default={}),
        RecordField('defer', OneOfVal(StrVal(), BoolVal()), default=None))

    data_spec_with_shorthand = OneOfVal(StrVal(), data_spec)

    def __call__(self, data):
        data = self.data_spec_with_shorthand(data)
        if isinstance(data, basestring):
            data = self.data_spec({'url': data})

        refs = {}
        for name, ref in data.refs.items():
            if not isinstance(ref, (tuple, list)):
                ref = [ref]
            refs[name] = tuple(Reference(r) for r in ref)


        if self.IS_ROUTE_RE.match(data.url) is not None:
            ps = urlparse(data.url)
            params = {k: v if isinstance(v, list) else [v]
                    for k, v in parse_qsl(ps.query)}
            return DataSpec(
                route='%s:%s' % (ps.scheme, ps.path) if ps.scheme else ps.path,
                query=None,
                params=params,
                refs=refs,
                defer=data.defer
            )
        else:
            return DataSpec(
                route=None,
                query=data.url,
                params={},
                refs=refs,
                defer=data.defer
            )


class QueryHandler(object):

    def __init__(self, spec):
        self.query = spec.query
        self.parameters = spec.params


class DataField(StatefulField):
    """ Base class for fields with data.

    :keyword include_meta: Pass ``True`` if metadata should be provided to
                           widget. [default: ``False``]
    """

    class computator(object):

        inactive_value = NotImplemented

        def __init__(self, spec, field, **params):
            self.spec = spec
            self.field = field
            self.params = params

        def __call__(self, widget, state, graph, request):
            if not state.is_active or state.defer is not None:
                return self.inactive_value
            if self.spec.route:
                handler = route(self.spec.route)
                if handler is None:
                    raise Error("Invalid data reference:", self.spec.route)
            else:
                handler = QueryHandler(self.spec)
            data = self.fetch(handler, self.spec, graph)
            if data.id is None:
                data = data._replace(id=state.id) # pylint: disable=protected-access
            return data

        def fetch(self, handler, spec, graph):
            """ Fetch data using ``handler`` in context of the current
            application state ``graph``.
            """
            raise NotImplementedError(
                "%s.fetch(handler, graph) is not implemented" % \
                self.__class__.__name__)

        def execute(self, handler, spec, **params):
            """ Execute ``handler`` with given ``params``.

            This method is often used by :class:`DataComputator` subclasses to
            implement :method:`fetch`.
            """
            if hasattr(handler, 'port'):
                return self.execute_port(handler, spec, **params)
            elif hasattr(handler, 'query'):
                return self.execute_query(handler, spec, **params)
            else:
                raise NotImplementedError('Unknown data reference: %s' % spec.route)

        def execute_port(self, handler, spec, **params):
            query = dict(spec.params)

            predefined_sort_params = sort_params(query)
            override_sort_params = sort_params(params)

            if predefined_sort_params and override_sort_params:
                for k in predefined_sort_params:
                    del query[k]

            query.update(params)
            query = urlencode(query)

            log.debug('fetching port: %s?%s', spec.route, query)

            with measure_execution_time(log=log):
                product = handler.port.produce(query)
            data = product_to_json(product)
            data = data[product.meta.domain.fields[0].tag]
            if self.field.include_meta:
                meta = product_meta_to_json(handler.port.describe())
                meta = meta['domain']['fields'][0]
                return Data(data, meta=meta)
            else:
                return Data(data)

        def execute_query(self, handler, spec, **params):
            query = dict(handler.parameters)
            query.update(query)
            query.update(params)

            for k, v in query.items():
                v = v[0] if isinstance(v, list) else v
                if v == False or v is None or v == 'false':
                    v = ''
                query[k] = v

            log.debug(
                'fetching query: %s?%s',
                spec.route,
                urllib.urlencode(query, doseq=True)
            )

            with measure_execution_time(log=log), get_db():
                product = htsql.core.cmd.act.produce(handler.query, **query)

            data = product_to_json(product)
            data = data[product.meta.tag]

            if self.field.include_meta:
                meta = product_meta_to_json(product)
                return Data(data, meta=meta)
            else:
                return Data(data)

    def __init__(self, include_meta=False, default=NotImplemented, doc=None):
        super(DataField, self).__init__(DataSpecVal(), default=default, doc=doc)
        self.include_meta = include_meta

    def describe(self, name, spec, widget):
        if spec is None:
            return []
        state_id = "%s/%s" % (widget.id, name)
        dependencies = [r.id for refs in spec.refs.values() for r in refs]
        st = State(
            id=state_id,
            widget=widget,
            computator=self.computator(spec, self),
            dependencies=dependencies,
            is_writable=False,
            defer=spec.defer)
        return [(name, st)]


def sort_params(params):
    return {k: v for k, v in params.items() if k[-5:] == ':sort'}


def map_param(param):
    # 0 == False, thanks Python
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


def product_to_json(product):
    """ Convert product to JSON serializeable object.

    :param product: Product to convert
    :type product: :class:`htsql.code.domain.Product`
    """
    # TODO: we should remove unparse/parse phase
    with get_db():
        data = ''.join(emit('application/json', product))
    data = json.loads(data)
    return data


def product_meta_to_json(product):
    """ Convert product's meta to JSON serializeable object.

    :param product: Product to convert meta of
    :type product: :class:`htsql.code.domain.Product`
    """
    # TODO: we should remove unparse/parse phase
    with get_db():
        data = ''.join(emit('x-htsql/raw', product))
    data = json.loads(data)
    return data['meta']
