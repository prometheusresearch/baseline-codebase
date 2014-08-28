#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Error, guard
from rex.web import not_found, authorize, trusted, render_to_response
from rex.db import get_db
from webob import Response
from webob.exc import HTTPUnauthorized, HTTPForbidden, HTTPMovedPermanently
import htsql.core.error
import htsql.core.cmd.act
import htsql.core.fmt.accept
import htsql.core.fmt.emit


class TemplateRenderer(object):
    # Renders a Jinja template.

    def __init__(self, path, template, access, unsafe,
                 parameters, validates, context):
        # Path mask for extracting labeled segments.
        self.path = path
        # Package path to the template.
        self.template = template
        # Permission to request the URL.
        self.access = access
        # If set, enables CSRF protection.
        self.unsafe = unsafe
        # Maps parameter names to default values.
        self.parameters = parameters
        # Maps parameter names and segment labels to respective validators.
        self.validates = validates
        # Arguments to pass to the template.
        self.context = context

    def __call__(self, req):
        # Check permissions.
        self.authorize(req)
        # Parse the URL and prepare template arguments.
        try:
            context = self.parse(req)
        except Error, error:
            return req.get_response(error)
        # Render the template.
        return render_to_response(self.template, req, **context)

    def authorize(self, req):
        # Check access permissions.
        if not authorize(req, self.access):
            raise HTTPUnauthorized()
        # Protect against CSRF attacts.
        if self.unsafe and not trusted(req):
            raise HTTPForbidden()

    def parse(self, req):
        # Start with regular context parameters.
        context = self.context.copy()
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
                if name in self.validates:
                    with guard("While parsing parameter:", name):
                        value = self.validates[name](value)
            context[name] = value
        # Process segment labels.
        for label, segment in sorted(self.path(req.path_info).items()):
            if label in self.validates:
                with guard("While parsing segment:", "$"+label):
                    segment = self.validates[label](segment)
            context[label] = segment
        return context


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


class WidgetRenderer(object):
    # Renders a widget.

    def __init__(self, widget, access):
        # The screen to render.
        self.widget = widget
        # Permission to request the URL.
        self.access = access

    def __call__(self, req):
        # Check permissions.
        self.authorize(req)
        # Let the widget render itself.
        try:
            return self.widget(req)
        except Error, error:
            return req.get_response(error)

    def authorize(self, req):
        # Check access permissions.
        if not authorize(req, self.access):
            raise HTTPUnauthorized()


