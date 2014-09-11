#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Error, guard, MaybeVal, StrVal, BoolVal, MapVal, locate
from rex.web import authorize, trusted
from rex.port import GrowVal, Port
from .map import Map
from webob.exc import HTTPUnauthorized, HTTPForbidden


class PortRenderer(object):
    # Renders a database port.

    def __init__(self, port, access, unsafe):
        # Database port.
        self.port = port
        # Permission to request the URL.
        self.access = access
        # If set, enables CSRF protection.
        self.unsafe = unsafe

    def __call__(self, req):
        # Check permissions.
        self.authorize(req)
        # Submit the request to the port.
        try:
            return self.port(req)
        except Error, error:
            return req.get_response(error)

    def authorize(self, req):
        # Check access permissions.
        if not authorize(req, self.access):
            raise HTTPUnauthorized()
        # Protect against CSRF attacts.
        if self.unsafe and not trusted(req):
            raise HTTPForbidden()


class MapPort(Map):

    fields = [
            ('port', GrowVal),
            ('access', StrVal, None),
            ('unsafe', BoolVal, False),
    ]

    def __call__(self, spec, path, context):
        with guard("While creating port:", locate(spec)):
            port = Port(spec.port)
        access = spec.access or self.package.name
        return PortRenderer(
                port=port,
                access=access,
                unsafe=spec.unsafe)

    def override(self, spec, override_spec):
        if override_spec.port is not None:
            port = []
            for port_spec in [spec, override_spec]:
                if isinstance(port_spec.port, list):
                    port.extend(port_spec.port)
                else:
                    port.append(port_spec.port)
            spec = spec.__clone__(port=port)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        if override_spec.unsafe is not None:
            spec = spec.__clone__(unsafe=override_spec.unsafe)
        return spec


