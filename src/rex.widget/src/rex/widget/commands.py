"""

    rex.widget.commands
    ===================

    :copyright: 2015, Prometheus Research, LLC

"""

from webob import Response
from rex.web import Command, Authorize

__all__ = ('Permissions',)


class Permissions(Command):

    path = "/permissions"
    access = "anybody"

    def render(self, req):
        permissions = [
            (name, permission()(req))
            for name, permission
            in Authorize.map_all().items()
        ]
        return Response(json={
            name: permission
            for name, permission
            in permissions
            if permission
        })
