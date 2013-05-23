#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .extension import Extension
from .cache import cached


class WSGI(Extension):

    @classmethod
    def build(cls):
        return cls()

    def __call__(self, environ, start_response):
        start_response("404 Not Found", [('Content-Type', 'text/plain')])
        return ["Application does not provide web access.\n"]


@cached
def get_wsgi():
    wsgi_type = WSGI.top()
    return wsgi_type.build()


