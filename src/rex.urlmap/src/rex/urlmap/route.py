#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.web import Route
from .load import load_map


class RouteURLMap(Route):
    # Adds a `urlmap.yaml` handler to the package routing pipeline.

    priority = 40

    def __call__(self, package, fallback):
        if package.exists('urlmap.yaml'):
            # Report any errors in configuration on startup.
            load_map(package, fallback)
            return URLMapper(package, fallback)
        return fallback


class URLMapper(object):
    # `urlmap.yaml` handler.

    def __init__(self, package, fallback=None):
        self.package = package
        self.fallback = fallback

    def __call__(self, req):
        # Load and parse `urlmap.yaml`; delegate the request to the tree
        # walker.
        handler = load_map(self.package, self.fallback)
        return handler(req)


