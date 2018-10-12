#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Error, guard, MaybeVal, StrVal, BoolVal, MapVal
from rex.web import authorize, trusted, confine, render_to_response
from .load import _merge
from .map import Map
from webob.exc import HTTPUnauthorized, HTTPForbidden
import os.path


class TemplateRenderer:
    # Renders a Jinja template.

    def __init__(self, path, template, access, unsafe,
                 parameters, context):
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
        # Maps parameter names and segment labels to their validators (TODO).
        self.validates = {}
        # Arguments to pass to the template.
        self.context = context

    def __call__(self, req):
        # Check permissions.
        self.authorize(req)
        with confine(req, self):
            # Parse the URL and prepare template arguments.
            try:
                context = self.parse(req)
            except Error as error:
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
                # TODO:
                #if name in self.validates:
                #    with guard("While parsing parameter:", name):
                #        value = self.validates[name](value)
            context[name] = value
        # Process segment labels.
        for label, segment in sorted(self.path(req.path_info).items()):
            # TODO:
            #if label in self.validates:
            #    with guard("While parsing segment:", "$"+label):
            #        segment = self.validates[label](segment)
            context[label] = segment
        return context


class MapTemplate(Map):
    # Parses a `template` entry.

    fields = [
            ('template', StrVal(r'[/0-9A-Za-z:._-]+')),
            ('access', StrVal, None),
            ('unsafe', BoolVal, False),
            ('parameters', MapVal(StrVal(r'[A-Za-z_][0-9A-Za-z_]*'),
                                  MaybeVal(StrVal)), {}),
            ('context', MapVal(StrVal(r'[A-Za-z_][0-9A-Za-z_]*')), {}),
    ]

    def __call__(self, spec, path, context):
        context = _merge(context, spec.context)
        access = spec.access or self.package.name
        return TemplateRenderer(
                path=path,
                template=spec.template,
                access=access,
                unsafe=spec.unsafe,
                parameters=spec.parameters,
                context=context)

    def override(self, spec, override_spec):
        if override_spec.template is not None:
            spec = spec.__clone__(template=override_spec.template)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        if override_spec.unsafe is not None:
            spec = spec.__clone__(unsafe=override_spec.unsafe)
        if override_spec.parameters is not None:
            parameters = _merge(spec.parameters, override_spec.parameters)
            spec = spec.__clone__(parameters=parameters)
        if override_spec.context is not None:
            context = _merge(spec.context, override_spec.context)
            spec = spec.__clone__(context=context)
        return spec

    def abspath(self, spec, current_package, current_directory):
        if ':' not in spec.template:
            template = "%s:%s" % \
                    (current_package,
                     os.path.join(current_directory, spec.template))
            spec = spec.__clone__(template=template)
        return spec


