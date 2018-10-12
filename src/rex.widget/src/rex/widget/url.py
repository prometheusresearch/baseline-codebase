"""

    rex.widget.url
    ==============

    Representation for URLs with a Rex Widget application.

    :copyright: 2015, Prometheus Research, LLC

"""

from urllib.parse import urlencode

from rex.core import Validate, StrVal
from rex.web import url_for

from .transitionable import TransitionableRecord

__all__ = ('URL', 'PortURL', 'QueryURL', 'MutationURL', 'RequestURL', 'URLVal')


class URL(TransitionableRecord):
    """ Representation for URL.

    This is the preferred way to represent URLs within an application as it
    resolves package URLs (in the form of ``package:/path``) to valid URLs
    relative to current WSGI request.
    """

    __transit_tag__ = 'url'

    fields = ('route', 'params')

    def __init__(self, route, params=None):
        super(URL, self).__init__(route=route, params=params)

    def __transit_format__(self, req, path): # pylint: disable=arguments-differ
        route = self.route
        if route.startswith('/'):
            package = req.environ['rex.package']
            route = '%s:%s' % (package, route)
        route = url_for(req, route) # pylint: disable=no-member
        if self.params: # pylint: disable=no-member
            route = route + '?' + urlencode(self.params) # pylint: disable=no-member
        return (route,)


class PortURL(URL):
    """ URL for ports.

    Works like :class:`URL` but values of such type will be deserialized into
    ``Port`` class instances in JavaScript runtime.
    """

    __transit_tag__ = 'port'


class QueryURL(URL):
    """ URL for HTSQL query.

    Works like :class:`URL` but values of such type will be deserialized into
    ``Query`` class instances in JavaScript runtime.
    """

    __transit_tag__ = 'query'


class MutationURL(URL):
    """ URL for mutation.
    """

    __transit_tag__ = 'mutation'


class RequestURL(URL):
    """ URL for mutation.
    """

    __transit_tag__ = 'request_url'


class URLVal(Validate):
    """ Validator for URL values.

    By default it produces :class:`URL` values but can be configured to produce
    other URL values (like :class:`PortURL` or :class:`QueryURL`) via
    ``url_type`` argument.

    :keyword url_type: Which URL type to use
    :type url_type: type
    """

    _validate = StrVal()

    def __init__(self, url_type=URL):
        self.url_type = url_type

    def __call__(self, value):
        if isinstance(value, self.url_type):
            return value
        value = self._validate(value)
        return self.url_type(value)
