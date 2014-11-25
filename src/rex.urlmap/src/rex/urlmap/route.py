#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.web import Route, PathMap
from .load import load_map


class RouteURLMap(Route):
    # Adds a `urlmap.yaml` handler to the package routing pipeline.

    priority = [40, "urlmap"]
    after = 'commands'

    def __call__(self, package):
        if package.exists('urlmap.yaml'):
            # Report any errors in configuration on startup.
            return load_map(package, open=self.open)
        return PathMap()


