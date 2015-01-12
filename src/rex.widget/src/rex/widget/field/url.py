"""

    rex.widget.field.url
    ====================

    :copyright: 2014, Prometheus Research, LLC

"""

from urllib import urlencode

from rex.core import Validate, RecordVal, OneOfVal, StrVal, MapVal
from rex.web import url_for

from ..state import Reference
from .state import StateFieldBase

__all__ = ('URLField',)


class ReferenceVal(Validate):

    _validate = StrVal()

    def __call__(self, value):
        if isinstance(value, Reference):
            return value
        value = self._validate(value)
        return Reference(value)


class URLVal(Validate):

    _validate_full = RecordVal(
        ('url', StrVal()),
        ('refs', MapVal(StrVal(), ReferenceVal()), {}),
        ('params', MapVal(StrVal(), StrVal()), {}),
    )

    _validate = OneOfVal(StrVal(), _validate_full)

    def __call__(self, value):
        value = self._validate(value)
        if isinstance(value, basestring):
            value = self._validate_full.record_type(
                url=value, refs={}, params={})
        return value


class URLField(StateFieldBase):

    _validate = URLVal()

    def __init__(self, default=NotImplemented, doc=None, name=None):
        super(URLField, self).__init__(
            self._validate, default=default, doc=doc, name=name)

    def dependencies(self, value):
        return value.refs.values()

    def compute(self, value, widget, state, graph, request):
        url = url_for(request, value.url)
        params = {}
        params.update(value.params)
        params.update(
            {k: graph[v] for k, v in value.refs.items() if graph[v] is not None})
        if params:
            url = '%s?%s' % (url, urlencode(params))
        return url
