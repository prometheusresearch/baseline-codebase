#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, guard
from .auth import authorize
from .handle import HandleLocation
from webob.exc import HTTPBadRequest, HTTPUnauthorized


class Parameter(object):
    """
    Describes a form parameter.

    `name`
        Parameter name.
    `validate`
        Callable that validates and normalizes a raw parameter value.
    `default`
        The value to use if the parameter is not provided.  If not set,
        the parameter is mandatory.
    """

    class _required_type(object):
        # For `sphinx.ext.autodoc`.
        def __repr__(self):
            return "REQUIRED"

    REQUIRED = _required_type()

    def __init__(self, name, validate, default=REQUIRED):
        self.name = name
        self.validate = validate
        self.default = default

    def __repr__(self):
        if self.default is self.REQUIRED:
            return "%s(%r, validate=%r)" \
                    % (self.__class__.__name__, self.name, self.validate)
        else:
            return "%s(%r, validate=%r, default=%r)" \
                    % (self.__class__.__name__,
                       self.name, self.validate, self.default)


class Command(HandleLocation):
    """
    Variant of :class:`.HandleLocation` with support for authorization and
    parameter parsing.
    """

    #: Location of the command.
    path = None
    #: Permission to execute the command.
    role = 'authenticated'
    #: List of form parameters.
    parameters = []

    @classmethod
    def sanitize(cls):
        if cls.path is not None:
            assert cls.render.__func__ is not Command.render.__func__, \
                    "abstract method %s.render()" % cls

    def __call__(self, req):
        self.authorize(req)
        arguments = self.parse(req)
        return self.render(req, **arguments)

    def authorize(self, req):
        # Checks if we have right permissions to execute the command.
        if self.role is not None:
            if not authorize(req, self.role):
                raise HTTPUnauthorized()

    def parse(self, req):
        # Parses query parameters.

        if self.parameters is None:
            # Skip parsing.
            return {}

        arguments = {}
        try:
            # Reject unknown paramerers.
            valid_keys = set(parameter.name for parameter in self.parameters)
            for key in req.params.keys():
                if key not in valid_keys:
                    raise Error("Found unknown parameter:", key)
            # Process expected parameters.
            for parameter in self.parameters:
                if parameter.name not in req.params:
                    if parameter.default is Parameter.REQUIRED:
                        raise Error("Cannot find parameter:", parameter.name)
                    else:
                        value = parameter.default
                else:
                    value = req.params[parameter.name]
                    with guard("While parsing parameter:", parameter.name):
                        value = parameter.validate(value)
                arguments[parameter.name] = value
        except Error, error:
            # Trick WebOb into rendering the error properly in text mode.
            # FIXME: WebOb cuts out anything resembling a <tag>.
            body_template = None
            accept = req.environ.get('HTTP_ACCEPT', '')
            if not ('html' in accept or '*/*' in accept):
                error = str(error).replace("\n", "<br \>")
                body_template = """${explanation}<br /><br />${detail}"""
            raise HTTPBadRequest(error, body_template=body_template)

        return arguments

    def render(self, req, **arguments):
        """
        Processes the incoming request and parsed form parameters; returns HTTP
        response.

        Implementations must override this method.
        """
        raise NotImplementedError("%s.render()" % self.__class__.__name__)


