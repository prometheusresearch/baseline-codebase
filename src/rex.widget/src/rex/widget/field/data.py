"""

    rex.widget.field.data
    =====================

    Base classes and utilities for widget fields which fetch data from a
    database.

    :copyright: 2014, Prometheus Research, LLC

"""

import urllib
import simplejson as json
from collections import namedtuple
from functools import partial
from logging import getLogger
from urlparse import urlparse, parse_qsl

from htsql.core.fmt.emit import emit

from rex.core import Error, Validate
from rex.core import RecordVal, OneOfVal, MapVal, SeqVal, StrVal, BoolVal
from rex.db import get_db
from rex.web import route

from ..undefined import undefined
from ..state import State, Reference
from ..descriptors import StateRead
from ..util import cached_property, get_validator_for_key
from ..json_encoder import register_adapter
from .base import Field


log = getLogger(__name__)

__all__ = (
    'DataField', 'DataSpec', 'DataRefVal',
    'product_to_json', 'product_meta_to_json',
)


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


class DataSpec(object):
    """ Specification for fetching an entity."""

    def __init__(self, route, refs=None, defer=None, params=None):
        self.route = route
        self.refs = refs or {}
        self.params = params
        self.defer = defer

    @cached_property
    def port(self):
        handler = route(self.route)
        if handler is None:
            raise Error(
                "Entity reference '%s' cannot be resolved against URL "
                "Mapping configuration" % self.route)
        if not hasattr(handler, 'port'):
            raise Error(
                "Collection reference '%s' should point to a port" % self.route)
        return handler.port

    @cached_property
    def meta(self):
        return self.port.describe()

    @property
    def entity(self):
        return self.meta.domain.fields[0].tag

    def __repr__(self):
        return '%s(route=%r, refs=%r, params=%r, defer=%r)' % (
            self.__class__.__name__,
            self.route, self.refs, self.params, self.defer)

    __str__ = __repr__
    __unicode__ = __repr__


@register_adapter(DataSpec)
def _encode_DataSpec(spec):
    return {
        'route': spec.route,
        'refs': spec.refs,
        'params': spec.params,
        'defer': spec.defer,
    }


class DataRef(namedtuple('DataRef', ['ref', 'required'])):
    """ Reference to a state."""


class DataRefVal(Validate):

    class _ValidateSingle(Validate):

        _validate = RecordVal(
            ('ref', StrVal()),
            ('required', BoolVal(), False)
        )

        _validate_or_shorthand = OneOfVal(StrVal(), _validate)

        def __call__(self, value):
            value = self._validate_or_shorthand(value)
            if isinstance(value, basestring):
                value = self._validate.record_type(ref=value, required=False)
            return value

    _validate_single = _ValidateSingle()
    _validate = OneOfVal(_validate_single, SeqVal(_validate_single))

    def __call__(self, value):
        if isinstance(value, (tuple, list)) and all(isinstance(x, DataRef) for x in value):
            return value
        value = self._validate(value)
        if not isinstance(value, (tuple, list)):
            value = [value]

        references = []
        for v in value:
            references.append(DataRef(
                ref=Reference(v.ref),
                required=v.required,
            ))

        return tuple(references)


class DataSpecVal(Validate):
    """ Valudator for :class:`EntitySpec`."""

    refs_val = MapVal(StrVal(), DataRefVal())

    data_spec = RecordVal(
        ('data', StrVal()),
        ('refs', refs_val, {}),
    )

    data_spec_with_shorthand = OneOfVal(StrVal(), data_spec)

    def __init__(self, enable_refs=True):
        self.enable_refs = enable_refs

    def __call__(self, data):
        if isinstance(data, DataSpec):
            return data
        data = self.data_spec_with_shorthand(data)
        if isinstance(data, basestring):
            data = self.data_spec({'data': data})
        if not self.enable_refs and data.refs:
            raise Error('refs are not enabled for this data specification')

        parsed = urlparse(data.data)
        route = '%s:%s' % (parsed.scheme, parsed.path) if parsed.scheme else parsed.path
        params = {k: v if isinstance(v, list) else [v]
                for k, v in parse_qsl(parsed.query)}
        return DataSpec(
            route=route,
            params=params,
            refs=data.refs,
            defer=None,
        )

    def __getitem__(self, key):
        return get_validator_for_key(self.data_spec, key)


class DataField(Field):
    """ Base class for fields which fetch data from database.
    """

    spec_validator = NotImplemented

    def __init__(self, include_meta=False, default=NotImplemented, doc=None,
            manager=None, name=None):
        super(DataField, self).__init__(
            self.spec_validator(),
            default=default,
            doc=doc,
            name=name
        )
        self.manager = manager
        self.include_meta = include_meta

    def apply(self, widget, spec):
        if spec is undefined:
            return {}, []
        dependencies = [r.ref.id for refs in spec.refs.values() for r in refs]
        data = State(
            id='%s/%s' % (widget.widget_id, self.name),
            widget=widget,
            computator=partial(self.produce, spec),
            dependencies=dependencies,
            is_writable=False,
            manager=self.manager,
            defer=spec.defer
        )

        props = {self.name: StateRead(data.id)}
        state = [data]

        if self.include_meta:
            meta = State(
                id='%s/%s/meta' % (widget.widget_id, self.name),
                widget=widget,
                value=product_meta_to_json(spec.meta)['domain']['fields'][0]['domain']['item']['domain'],
                is_writable=False
            )
            state.append(meta)
            props['%s_meta' % self.name] = StateRead(meta.id)
        return props, state

    def reassign(self, name, default=NotImplemented):
        default = self.default if default is NotImplemented else default
        return self.__class__(
            include_meta=self.include_meta,
            default=default,
            doc=self.__doc__,
            name=name,
            widget_class=self.widget_class,
        )

    def produce(self, spec, widget, state, graph, request):
        """ Produce an :class:`rex.widget.descriptors.DataRead` descriptor.

        :param spec: Data specification
        :type spec: rex.widget.field.data.DataSpec
        :param widget: Current widget
        :type spec: rex.widget.widget.Widget
        :param state: State
        :type state: rex.widget.state.State
        :param graph: Application state graph
        :type graph: rex.widget.state.StateGraph
        :param request: WSGI request
        :type request: webob.Requesy
        """
        raise NotImplementedError(
            'Subclasses of DataField should implement'
            ' produce(spec, widget, state, graph, request) method')


