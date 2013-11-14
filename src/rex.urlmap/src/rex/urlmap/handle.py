#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, guard
from rex.web import authorize, trusted, render_to_response
from webob.exc import HTTPNotFound, HTTPUnauthorized, HTTPForbidden


class TreeWalker(object):
    # Routes the request through the segment tree.

    def __init__(self, segment_map, fallback):
        # Maps a URL segment to a nested segment map; `'*'` denotes wildcard
        # segments; `None` denotes leaf handlers.
        self.segment_map = segment_map
        # Handler for URLs that don't match the segment map.
        self.fallback = fallback

    def __call__(self, req):
        # Split the URL into segments.
        segments = req.path_info[1:].split('/')
        # Traverse the segment tree.
        mapping = self.segment_map
        for segment in segments:
            if segment in mapping:
                mapping = mapping[segment]
            elif '*' in mapping:
                mapping = mapping['*']
            else:
                mapping = {}
                break
        # If found a leaf, use it; otherwise use `fallback`.
        if None in mapping:
            return mapping[None](req)
        if self.fallback is not None:
            return self.fallback(req)
        raise HTTPNotFound()


class TemplateRenderer(object):
    # Renders a Jinja template.

    def __init__(self, labels, template, access, unsafe,
                 parameters, validates, context):
        # List of names for URL segments; use `None` for unlabeled segments.
        self.labels = labels
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
        if self.access is not None and not authorize(req, self.access):
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
        segments = req.path_info[1:].split('/')
        for label, segment in zip(self.labels, segments):
            if label is not None:
                if label in self.validates:
                    with guard("While parsing segment:", "$"+label):
                        segment = self.validates[label](segment)
                context[label] = segment
        return context


