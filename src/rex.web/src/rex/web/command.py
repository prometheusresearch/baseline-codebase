#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Error, guard
from .auth import authorize, confine
from .csrf import trusted
from .handle import HandleLocation
from webob.exc import HTTPUnauthorized, HTTPForbidden
import copy


class Parameter:
    """
    Describes a form parameter.

    `name`
        Parameter name.
    `validate`
        Callable that validates and normalizes a raw parameter value.
    `default`
        The value to use if the parameter is not provided.  If not set,
        the parameter is mandatory.
    `many`
        If set, allow more than one value for the parameter.  All values
        are passed as a list.
    """

    class _required_type:
        # For the sake of `sphinx.ext.autodoc`.
        def __repr__(self):
            return "REQUIRED"

    REQUIRED = _required_type()

    def __init__(self, name, validate, default=REQUIRED, many=False):
        self.name = name
        self.validate = validate
        self.default = default
        self.many = many

    def __repr__(self):
        args = []
        args.append(repr(self.name))
        args.append("validate=%r" % self.validate)
        if self.default is not self.REQUIRED:
            args.append("default=%r" % self.default)
        if self.many is not False:
            args.append("many=%r" % self.many)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class Command(HandleLocation):
    """
    Variant of :class:`.HandleLocation` with support for authorization and
    parameter parsing.
    """

    #: Location of the command.
    path = None
    #: Permission to execute the command.
    access = None
    #: If set, indicates that the command has non-trivial side effects
    #: and can be executed only by trusted requests in order to prevent
    #: CSRF vulnerabilities.
    unsafe = False
    #: List of form parameters.
    parameters = []

    @classmethod
    def sanitize(cls):
        if cls.path is not None:
            super(Command, cls).sanitize()
            assert cls.render != Command.render, \
                    "abstract method %s.render()" % cls

    def __call__(self, req):
        self.authorize(req)
        with confine(req, self):
            try:
                arguments = self.parse(req)
            except Error as error:
                # Report the error in the response.
                return req.get_response(error)
            return self.render(req, **arguments)

    def authorize(self, req):
        # Checks if we have right permissions to execute the command.
        if not authorize(req, self):
            raise HTTPUnauthorized()
        # If the command has side effects, ensure that the request came
        # from our own site.
        if self.unsafe and not trusted(req):
            raise HTTPForbidden()
        # Ensure that CSRF token is never passed via GET parameters so
        # that it is not leaked through Referrer header.
        assert '_csrf_token' not in req.GET, \
                "_csrf_token must not be passed via query string"

    def parse(self, req):
        # Parses query parameters.

        # Extract segment labels.  If a label is listed in `parameters`,
        # the value will be validated and overriden later.
        arguments = self.path(req.path_info)

        if self.parameters is None:
            # Skip parsing.
            return arguments

        # Reject unknown parameters unless the parameter name starts with `_`.
        valid_keys = set(parameter.name for parameter in self.parameters)
        for key in list(req.params.keys()):
            if key in self.path.labels or \
                    not (key in valid_keys or key.startswith('_')):
                raise Error("Received unexpected parameter:", key)
        # Process expected parameters.
        for parameter in self.parameters:
            if parameter.name in self.path.labels:
                all_values = [arguments[parameter.name]]
            else:
                all_values = req.params.getall(parameter.name)
            if not all_values and parameter.default is Parameter.REQUIRED:
                # Missing mandatory parameter.
                raise Error("Cannot find parameter:", parameter.name)
            elif not all_values:
                # Missing optional parameter.
                value = copy.deepcopy(parameter.default)
            elif len(all_values) > 1 and not parameter.many:
                # Multiple values for a singular parameter.
                raise Error("Got multiple values for a parameter:",
                            parameter.name)
            else:
                with guard("While parsing parameter:", parameter.name):
                    all_values = [parameter.validate(value)
                                  for value in all_values]
                if parameter.many:
                    value = all_values
                else:
                    [value] = all_values
            arguments[parameter.name] = value

        return arguments

    def render(self, req, **arguments):
        """
        Processes the incoming request and parsed form parameters; returns HTTP
        response.

        Implementations must override this method.
        """
        raise NotImplementedError("%s.render()" % self.__class__.__name__)


