#
# Copyright (c) 2013, Prometheus Research, LLC
#

from routes import Mapper
from webob.exc import HTTPNotFound

from rex.web import Route

from .command import RestfulLocation


__all__ = (
    'RestfulDispatcher',
    'RestfulRoute',
)


class RestfulDispatcher(object):
    def __init__(self, handlers, fallback=None):
        self.handlers = handlers
        self.fallback = fallback

        mapper = Mapper()
        for handler in handlers:
            mapper.connect(None, handler.path, handler=handler)
        self.mapper = mapper

    def __call__(self, request):
        path = request.path_info

        mapped = self.mapper.match(path)
        if mapped:
            handler = mapped.pop('handler')()
            return handler(request, **mapped)

        if self.fallback is not None:
            return self.fallback(request)

        raise HTTPNotFound()


class RestfulRoute(Route):
    # This has to be < 10, which is currently the static file router, because
    # that router sends any request for a file that starts with _ or . into a
    # black hole.
    priority = 5

    def __call__(self, package, fallback):
        handlers = RestfulLocation.by_package(package)
        if handlers:
            return RestfulDispatcher(handlers, fallback)
        return fallback

