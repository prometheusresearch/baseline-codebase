#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .extension import Extension
from .cache import cached


class WSGI(Extension):
    """
    Interface for WSGI entry point.
    """

    @classmethod
    def build(cls):
        """
        Builds the WSGI entry points.

        Implementations must override this method.
        """
        return cls()

    def __call__(self, environ, start_response):
        start_response("404 Not Found", [('Content-Type', 'text/plain')])
        return ["Application does not provide web access.\n"]


@cached
def get_wsgi():
    """
    Returns the WSGI entry point of the active application.
    """
    wsgi_type = WSGI.top()
    return wsgi_type.build()


