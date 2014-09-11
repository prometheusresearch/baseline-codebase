#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Error, MaybeVal, StrVal, BoolVal, MapVal
from rex.web import authorize, trusted
from rex.db import get_db
from .map import Map
from webob import Response
from webob.exc import HTTPUnauthorized, HTTPForbidden
import htsql.core.error
import htsql.core.cmd.act
import htsql.core.fmt.accept
import htsql.core.fmt.emit


class QueryRenderer(object):
    # Renders an HTSQL query.

    def __init__(self, path, query, parameters, access, unsafe):
        # Path mask for extracting labeled segments.
        self.path = path
        # HTSQL query.
        self.query = query
        # Default values for query parameters.
        self.parameters = parameters
        # Permission to request the URL.
        self.access = access
        # If set, enables CSRF protection.
        self.unsafe = unsafe

    def __call__(self, req):
        # Check permissions.
        self.authorize(req)
        # Parse query parameters.
        try:
            parameters = self.parse(req)
        except Error, error:
            return req.get_response(error)
        # Execute the query and render the output.
        with get_db():
            try:
                product = htsql.core.cmd.act.produce(self.query, parameters)
                format = htsql.core.fmt.accept.accept(req.environ)
                headerlist = htsql.core.fmt.emit.emit_headers(format, product)
                app_iter = list(htsql.core.fmt.emit.emit(format, product))
            except htsql.core.error.HTTPError, error:
                return req.get_response(error)
            resp = Response(headerlist=headerlist, app_iter=app_iter)
        return resp

    def parse(self, req):
        parameters = {}
        # Reject unknown parameters.
        for name in sorted(req.params):
            if not (name in self.parameters or name.startswith('_')):
                raise Error("Received unexpected parameter:", name)
        # Process expected parameters.
        for name in sorted(self.parameters):
            all_values = req.params.getall(name)
            if not all_values:
                value = self.parameters[name]
            elif len(all_values) > 1:
                raise Error("Got multiple values for parameter:", name)
            else:
                [value] = all_values
            parameters[name] = value
        # Process segment labels.
        for label, segment in sorted(self.path(req.path_info).items()):
            parameters[label] = segment
        return parameters

    def authorize(self, req):
        # Check access permissions.
        if not authorize(req, self.access):
            raise HTTPUnauthorized()
        # Protect against CSRF attacts.
        if self.unsafe and not trusted(req):
            raise HTTPForbidden()


class MapQuery(Map):
    # Parses a `query` entry.

    fields = [
            ('query', StrVal),
            ('parameters', MapVal(StrVal(r'[A-Za-z_][0-9A-Za-z_]*'),
                                  MaybeVal(StrVal)), {}),
            ('access', StrVal, None),
            ('unsafe', BoolVal, False),
    ]

    def __call__(self, spec, path, context):
        access = spec.access or self.package.name
        return QueryRenderer(
                path=path,
                query=spec.query,
                parameters=spec.parameters,
                access=access,
                unsafe=spec.unsafe)

    def override(self, spec, override_spec):
        if override_spec.query is not None:
            spec = spec.__clone__(query=override_spec.query)
        if override_spec.parameters is not None:
            parameters = {}
            parameters.update(spec.parameters)
            parameters.update(override_spec.parameters)
            spec = spec.__clone__(parameters=parameters)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        if override_spec.unsafe is not None:
            spec = spec.__clone__(unsafe=override_spec.unsafe)
        return spec


