#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Error, guard
from rex.web import not_found, authorize, trusted, render_to_response
from webob.exc import HTTPUnauthorized, HTTPForbidden


class TreeWalker(object):
    # Routes the request through the segment tree.

    def __init__(self, segment_map, fallback):
        # Maps URLs to handlers.
        self.segment_map = segment_map
        # Handler for URLs that don't match the segment map.
        self.fallback = fallback or not_found

    def __call__(self, req):
        # Find the handle for the URL.
        handle = self.segment_map.get(req.path_info, self.fallback)
        return handle(req)


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


