#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob import Response
from webob.exc import HTTPMethodNotAllowed, HTTPException, HTTPBadRequest

from rex.core import StrVal, Error
from rex.web import Command, Parameter

from .serializer import Serializer


__all__ = (
    'RestfulLocation',
    'SimpleResource',
)


# pylint: disable=W0223
class RestfulLocation(Command):
    """
    This is the base class for the core functionality of rex.restful.

    .. method:: retrieve(request, **params)

        This method is executed when the path recieves an HTTP GET request.

        On successful execution, this method will result in an HTTP status of
        200.

        If this method is not implemented in a concrete class, then the path
        associated with this class will respond with an HTTP 405 (Method Not
        Allowed) error when invoked with a GET.

        :param params:
            Much like the base ``rex.web.Command`` class that this class is
            based on, this dictionary contains all the parameters that are sent
            to the path as part of the URL or as querystring parameters. Note
            that even if no parameters are expected (e.g., none are defined in
            the ``parameters`` property on this class), this method will always
            receive the ``format`` parameter.
        :type params: dict
        :param request: the Request object associated with this HTTP request
        :type request: Request
        :returns:
            This method should return whatever is appropriate for the API you
            are implementing. This return value is passed through a
            ``Serializer`` before it is sent to the client.

    .. method:: create(request, **params)

        This method is executed when the path recieves an HTTP POST request.

        Any content sent by the client in the request's body will be
        automatically decoded into the appropriate Python object using the
        ``Serializer`` mechanics and stored on the ``payload`` property of the
        ``request`` argument.

        On successful execution, this method will result in an HTTP status of
        201.

        If this method is not implemented in a concrete class, then the path
        associated with this class will respond with an HTTP 405 (Method Not
        Allowed) error when invoked with a POST.

        :param params:
            Much like the base ``rex.web.Command`` class that this class is
            based on, this dictionary contains all the parameters that are sent
            to the path as part of the URL or as querystring parameters. Note
            that even if no parameters are expected (e.g., none are defined in
            the ``parameters`` property on this class), this method will always
            receive the ``format`` parameter.
        :type params: dict
        :param request: the Request object associated with this HTTP request
        :type request: Request
        :returns:
            This method should return whatever is appropriate for the API you
            are implementing. This return value is passed through a
            ``Serializer`` before it is sent to the client.

    .. method:: update(request, **params)

        This method is executed when the path recieves an HTTP PUT request.

        Any content sent by the client in the request's body will be
        automatically decoded into the appropriate Python object using the
        ``Serializer`` mechanics and stored on the ``payload`` property of the
        ``request`` argument.

        On successful execution, this method will result in an HTTP status of
        202.

        If this method is not implemented in a concrete class, then the path
        associated with this class will respond with an HTTP 405 (Method Not
        Allowed) error when invoked with a PUT.

        :param params:
            Much like the base ``rex.web.Command`` class that this class is
            based on, this dictionary contains all the parameters that are sent
            to the path as part of the URL or as querystring parameters. Note
            that even if no parameters are expected (e.g., none are defined in
            the ``parameters`` property on this class), this method will always
            receive the ``format`` parameter.
        :type params: dict
        :param request: the Request object associated with this HTTP request
        :type request: Request
        :returns:
            This method should return whatever is appropriate for the API you
            are implementing. This return value is passed through a
            ``Serializer`` before it is sent to the client.

    .. method:: delete(request, **params)

        This method is executed when the path recieves an HTTP DELETE request.

        On successful execution, this method will result in an HTTP status of
        204.

        If this method is not implemented in a concrete class, then the path
        associated with this class will respond with an HTTP 405 (Method Not
        Allowed) error when invoked with a PUT.

        :param params:
            Much like the base ``rex.web.Command`` class that this class is
            based on, this dictionary contains all the parameters that are sent
            to the path as part of the URL or as querystring parameters. Note
            that even if no parameters are expected (e.g., none are defined in
            the ``parameters`` property on this class), this method will always
            receive the ``format`` parameter.
        :type params: dict
        :param request: the Request object associated with this HTTP request
        :type request: Request
        :returns:
            Nothing. Anything returned by this method will be ignored, and will
            not be sent to the client.
    """

    #: The permission required to access this location.
    access = 'authenticated'

    #: The URL that this location responds to. Must be specified by concrete
    #: classes.
    path = None

    #: The default format identifier to use when/if a compatible Serializer
    #: cannot be detected via the request headers or format parameter.
    default_format = 'json'

    #: The list of ``Parameter`` that are expected to be received through both
    #: ``path`` variables and/or URL querystring parameters.
    parameters = []

    _METHOD_MAP = {
        'POST': 'create',
        'GET': 'retrieve',
        'PUT': 'update',
        'DELETE': 'delete',
    }
    _STATUS_MAP = {
        'POST': 201,
        'GET': 200,
        'PUT': 202,
        'DELETE': 204,
    }

    @classmethod
    def sanitize(cls):
        if cls.enabled():
            super(RestfulLocation, cls).sanitize()

            # Make sure there's at least one verb implemented.
            for method in cls._METHOD_MAP.values():
                if hasattr(cls, method):
                    break
            else:
                assert False, 'No resource methods defined on %s' % cls

            # Add a Parameter to capture "format" if it isn't already there.
            cls.parameters = list(cls.parameters)
            for param in cls.parameters:
                if param.name == 'format':
                    break
            else:
                cls.parameters.append(
                    Parameter('format', StrVal(), None),
                )

    def get_response_serializer(self, request):
        for mime_type in request.accept:
            serializer = Serializer.get_for_mime_type(mime_type)
            if serializer:
                return serializer()

        fmt = request.GET.get('format')
        serializer = Serializer.get_for_format(fmt)
        if serializer:
            return serializer()

        return Serializer.get_for_format(self.default_format)()

    def parse_payload(self, request):
        # pylint: disable=no-self-use

        content_type = None
        payload = {}

        if request.method.upper() in ('POST', 'PUT'):
            content_type = request.headers.get('Content-Type')
            if content_type and request.body:
                serializer = Serializer.get_for_mime_type(content_type)
                if serializer:
                    serializer = serializer()
                    content_type = serializer.mime_type
                    try:
                        payload = serializer.deserialize(request.body)
                    except Exception as exc:
                        raise HTTPBadRequest(
                            'The incoming payload could not be deserialized'
                            ' (%s)' % (
                                unicode(exc),
                            )
                        )

        # TODO: we should be able to validate the payload
        # in the same sort of way that we validate the parameters.

        return payload, content_type

    class _FakeRequest(object):
        def __init__(self, request):
            self.params = request.params
            self.path_info = request.path_info

    def parse_arguments(self, request):
        # We want to use the logic within Command.parse(), but we only want it
        # to operate on GET variables, not POST. So, until self.parse() is
        # refactored a little bit, we'll send it a mock request.
        try:
            return self.parse(RestfulLocation._FakeRequest(request))
        except Error as exc:
            raise HTTPBadRequest(unicode(exc))

    def __call__(self, request, **kwargs):
        self.authorize(request)

        implementation, status = self._get_method_handler(request)

        if not implementation:
            raise HTTPMethodNotAllowed()

        try:
            payload, content_type = self.parse_payload(request)
            request.payload = payload
            request.content_type = content_type

            arguments = self.parse_arguments(request)
            kwargs.update(arguments)

            response = implementation(request, **kwargs)
        except HTTPException, exc:

            response = {
                'error': unicode(exc),
            }
            if hasattr(exc, 'status'):
                status = exc.status
            else:
                status = 500

        if not isinstance(response, Response):
            serializer = self.get_response_serializer(request)

            if response is not None:
                response = serializer.serialize(response)

            response = Response(
                response,
                status=status,
                content_type=serializer.mime_type,
            )

        return response

    def _get_method_handler(self, request):
        method = request.method.upper()
        implementation = None
        default_status = 200

        if method in RestfulLocation._METHOD_MAP:
            implementation = getattr(
                self,
                RestfulLocation._METHOD_MAP[method],
                None,
            )
            default_status = RestfulLocation._STATUS_MAP[method]

        elif method == 'OPTIONS':
            implementation = self._options_handler

        return implementation, default_status

    # pylint: disable=W0613
    def _options_handler(self, request, **kwargs):
        allowed = ['OPTIONS']

        for meth, func_name in RestfulLocation._METHOD_MAP.items():
            if getattr(self, func_name, None):
                allowed.append(meth)

        response = Response()
        response.headers['Allow'] = ', '.join(allowed)

        return response

    def render(self, req, **arguments):
        # This is never called.
        pass  # pragma: no cover


class SimpleResource(RestfulLocation):
    """
    This is an extension of ``RestfulLocation`` to provide a convenient way to
    implement a common pattern of RESTful APIs. Many simple resources follow a
    pattern such as this:

    * The /foo URI accepts the following actions:

      * ``GET``: Returns an array of all the "foo" resources in the system.
      * ``POST``: Creates a brand new instance of the "foo" resource.

    * The /foo/{id} URI accepts the following actions:

      * ``GET``: Returns the "foo" instance identified by the ID in the URI.
      * ``PUT``: Updates the "foo" instance identified by the ID in the URI.
      * ``DELETE``: Deletes the "foo" instance identified by the ID in the URI.

    You can accomplish such a pattern by inheriting from this class and noting
    a few differences:

    * You must specify a property named ``base_path``. It functions just like
      the ``path`` property from ``RestfulLocation``, but is where the
      parent-level actions are mapped, whereas the ``path`` property is where
      the detail-level actions are mapped.

      * You can also specify a ``base_parameters`` property if your
        ``base_path`` includes variables.

    * The ``retrieve``, ``update``, and ``delete`` methods (if defined) will be
      utilized by the actions received by the detail-level ``path``.

    * The ``list`` and ``create`` methods (if defined) will be utilized by the
      actions received by the parent-level ``base_path``.


    .. method:: list(request, **params)

        This method is executed when the base_path recieves an HTTP GET
        request.

        On successful execution, this method will result in an HTTP status of
        200.

        If this method is not implemented in a concrete class, then the
        base_path associated with this class will respond with an HTTP 405
        (Method Not Allowed) error when invoked with a GET.

        :param params:
            Much like the base ``rex.web.Command`` class that this class is
            based on, this dictionary contains all the parameters that are sent
            to the path as part of the URL or as querystring parameters. Note
            that even if no parameters are expected (e.g., none are defined in
            the ``parameters`` property on this class), this method will always
            receive the ``format`` parameter.
        :type params: dict
        :param request: the Request object associated with this HTTP request
        :type request: Request
        :returns:
            This method should return whatever is appropriate for the API you
            are implementing. This return value is passed through a
            ``Serializer`` before it is sent to the client.
    """

    #: The URL that should handle the parent-level actions. Must be specified
    #: by concrete classes.
    base_path = None

    #: The list of ``Parameter`` that are expected to be received through both
    #: ``base_path`` variables and/or URL querystring parameters.
    base_parameters = []

    @classmethod
    def sanitize(cls):
        if cls.enabled():
            base_name = '%sBase' % cls.__name__

            # We want the base handler to inherit from RestfulLocation as well
            # as any other specified parent classes, but not from
            # SimpleResource itself.
            base_bases = tuple([RestfulLocation] + [
                base
                for base in cls.__bases__
                if not issubclass(base, RestfulLocation)
            ])

            base_attrs = dict(cls.__dict__)

            # Remove unsupported methods from the base.
            for attr in ['retrieve', 'update', 'delete']:
                if attr in base_attrs:
                    del base_attrs[attr]

            # Turn the 'list' method into a 'retrieve' on the base.
            if 'list' in base_attrs:
                base_attrs['retrieve'] = base_attrs['list']
                del base_attrs['list']
                delattr(cls, 'list')

            # Remove the create method from the detail handler.
            if 'create' in base_attrs:
                delattr(cls, 'create')

            for attr in ['path', 'parameters']:
                battr = 'base_%s' % attr
                if battr in base_attrs:
                    base_attrs[attr] = base_attrs[battr]
                    del base_attrs[battr]
                elif attr in base_attrs:
                    del base_attrs[attr]

            # Create the base handler.
            cls.__base_handler = type(
                base_name,
                base_bases,
                base_attrs,
            )

            super(SimpleResource, cls).sanitize()

