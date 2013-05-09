#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, guard
from .auth import authorize
from .handler import PathHandler
from webob.exc import HTTPBadRequest, HTTPUnauthorized


class Parameter(object):

    REQUIRED = object()

    def __init__(self, name, validate, default=REQUIRED):
        self.name = name
        self.validate = validate
        self.default = default

    def __repr__(self):
        if self.default is self.REQUIRED:
            return "%s(name=%r, validate=%r)" \
                    % (self.__class__.__name__, self.name, self.validate)
        else:
            return "%s(name=%r, validate=%r, default=%r)" \
                    % (self.__class__.__name__,
                       self.name, self.validate, self.default)


class Command(PathHandler):

    path = None
    role = 'authenticated'
    parameters = []

    def __call__(self, req):
        self.authorize(req)
        arguments = self.parse(req)
        return self.render(req, **arguments)

    def authorize(self, req):
        if self.role is not None:
            if not authorize(req, self.role):
                raise HTTPUnauthorized()

    def parse(self, req):
        if self.parameters is None:
            return {}
        arguments = {}
        try:
            valid_keys = set(parameter.name for parameter in self.parameters)
            for key in req.params.keys():
                if key not in valid_keys:
                    raise Error("Found unknown parameter:", key)
            for parameter in self.parameters:
                if parameter.name not in req.params:
                    if parameter.default is Parameter.REQUIRED:
                        raise Error("Cannot find parameter:", parameter.name)
                    else:
                        value = parameter.default
                else:
                    value = req.params[parameter.name]
                    with guard("While parsing parameter:", parameter.name):
                        if parameter.validate is not None:
                            value = parameter.validate(value)
                arguments[parameter.name] = value
        except Error, error:
            raise HTTPBadRequest(str(error))
        return arguments

    def render(self, req, **arguments):
        raise NotImplementedError("%s.render()" % self.__class__.__name__)


