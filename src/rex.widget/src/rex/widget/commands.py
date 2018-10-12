"""

    rex.widget.commands
    ===================

    :copyright: 2015, Prometheus Research, LLC

"""

import re

from webob import Response

from rex.core import StrVal
from rex.web import Command, Parameter, authorize, route

__all__ = ('Authorized',)


class Authorized(Command):

    path = '/authorized'
    access = 'anybody'

    parameters = [
        Parameter('access', StrVal())
    ]

    _IS_PACKAGE_URL = re.compile(r'^[a-zA-Z0-9_\-\.]+:.+$')

    def render(self, req, access):
        if access.startswith('http:') \
                or access.startswith('https:') \
                or access.startswith('/'):
            # assuming we always resolve URLs to the same app instance
            if not access.startswith(req.host_url):
                access = req.host_url + access
            mounts = list(req.environ['rex.mount'].items())
            mounts = sorted(mounts, key=lambda k_v: -len(k_v[1]))
            for pkg, prefix in mounts:
                if access.startswith(prefix):
                    access = pkg + ':' + access[len(prefix):]
                    break
        handler = route(access)
        if not hasattr(handler, 'access'):
            return Response(status=501,
                            body="Cannot obtain access for %s" % access)
        authorized = authorize(req, handler)
        return Response(json={'authorized': authorized})
