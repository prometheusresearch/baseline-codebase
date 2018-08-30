#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Error, guard, MaybeVal, StrVal, BoolVal, MapVal, locate
from rex.web import authorize, trusted, confine
from rex.db import get_db
from rex.port import GrowVal, Port
from .map import Map
from webob.exc import HTTPUnauthorized, HTTPForbidden, HTTPMethodNotAllowed


class PortRenderer(object):
    # Renders a database port.

    def __init__(self, port, access, unsafe, read_only=False):
        # Database port.
        self.port = port
        # Permission to request the URL.
        self.access = access
        # If set, enables CSRF protection.
        self.unsafe = unsafe
        # If set, forbid CRUD requests.
        self.read_only = read_only

    def __call__(self, req):
        # Check permissions.
        self.authorize(req)
        # Submit the request to the port.
        with confine(req, self):
            try:
                return self.port(req)
            except Error as error:
                return req.get_response(error)

    def authorize(self, req):
        # Check access permissions.
        if not authorize(req, self.access):
            raise HTTPUnauthorized()
        # Protect against CSRF attacts.
        if self.unsafe and not trusted(req):
            raise HTTPForbidden()
        # Forbid POST requests for read-only ports:
        if self.read_only and req.method == 'POST':
            raise HTTPMethodNotAllowed()


class MapPort(Map):

    fields = [
            ('port', GrowVal),
            ('gateway', StrVal(r'[A-Za-z_][0-9A-Za-z_]*'), None),
            ('access', StrVal, None),
            ('unsafe', BoolVal, False),
            ('read_only', BoolVal, False),
    ]

    def __call__(self, spec, path, context):
        with guard("While creating port:", locate(spec)):
            try:
                db = get_db(spec.gateway)
            except KeyError:
                db = None
            if db is None:
                raise Error("Found undefined gateway:", spec.gateway)
            port = Port(spec.port, db)
        access = spec.access or self.package.name
        return PortRenderer(
                port=port,
                access=access,
                unsafe=spec.unsafe,
                read_only=spec.read_only)

    def override(self, spec, override_spec):
        if override_spec.port is not None:
            port = []
            for port_spec in [spec, override_spec]:
                if isinstance(port_spec.port, list):
                    port.extend(port_spec.port)
                else:
                    port.append(port_spec.port)
            spec = spec.__clone__(port=port)
        if override_spec.gateway is not None:
            spec = spec.__clone__(gateway=override_spec.gateway)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        if override_spec.unsafe is not None:
            spec = spec.__clone__(unsafe=override_spec.unsafe)
        if override_spec.read_only is not None:
            spec = spec.__clone__(read_only=override_spec.read_only)
        return spec


