"""

    rex.widget.modern.url
    =====================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple

from rex.core import Validate, StrVal
from rex.web import url_for

from ..json_encoder import register_adapter

__all__ = ('URL', 'URLVal')


class URL(namedtuple('URL', ['route'])):
    """ An object representing a URL."""

    __slots__ = ()


@register_adapter(URL)
def _encode_URL(value, request):
    route = url_for(request, value.route)
    return route


class URLVal(Validate):
    """ Base class for validators for data specifications."""

    _validate = StrVal()

    def __call__(self, value):
        if isinstance(value, URL):
            return value
        value = self._validate(value)
        return URL(value)
