#
# Copyright (c) 2014, Prometheus Research, LLC
#


from cors import cors_handler, cors_options, http_response
from webob import Response
from webob.exc import HTTPMethodNotAllowed, HTTPException, HTTPBadRequest

from rex.core import StrVal, Error, AnyVal, get_settings
from rex.logging import get_logger
from rex.web import Command, Parameter

from .serializer import Serializer


__all__ = (
    'RestfulLocation',
    'SimpleResource',
)


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

    #: The identifier of the CORS policy configuration specified in the
    #: ``restful_cors_policies`` setting to use for this location. If not
    #: specified, no CORS functionality will be enabled.
    cors_policy = None

    #: The URL that this location responds to. Must be specified by concrete
    #: classes.
    path = None

    #: The default format identifier to use when/if a compatible Serializer
    #: cannot be detected via the request headers or format parameter.
    default_format = 'json'

    #: The keyward arguments to pass to the constructor of the Serializer used
    #: for requests handled by this resource.
    serializer_kwargs = {}

    #: The list of ``Parameter`` that are expected to be received through both
    #: ``path`` variables and/or URL querystring parameters.
    parameters = []

    #: The validator to use on the incoming payload for create actions.
    create_payload_validator = AnyVal()

    #: The validator to use on the incoming payload for update actions.
    update_payload_validator = AnyVal()

    _METHOD_MAP = {
        'POST': 'create',
        'GET': 'retrieve',
        'PUT': 'update',
        'DELETE': 'delete',
    }
    _PAYLOAD_METHODS = {
        'POST': 'create_payload_validator',
        'PUT': 'update_payload_validator',
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

    def __init__(self, *args, **kwargs):
        super(RestfulLocation, self).__init__(*args, **kwargs)
        self._request_logger = get_logger('rex.restful.wire.request')
        self._response_logger = get_logger('rex.restful.wire.response')

        self.cors_handler = None
        if self.cors_policy:
            opts = get_settings().restful_cors_policies[self.cors_policy]
            self.cors_handler = cors_handler.CorsHandler(
                cors_options.CorsOptions(
                    allow_origins=opts.allow_origins or True,
                    allow_methods=opts.allow_methods
                    or self._get_supported_methods(),
                    allow_headers=opts.allow_headers or True,
                    max_age=opts.max_age,
                    vary=opts.vary or None,
                    allow_credentials=False,
                    allow_non_cors_requests=opts.allow_non_cors
                    if opts.allow_non_cors is not None else True,
                    continue_on_error=False,
                )
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
        content_type = None
        payload = {}
        method = request.method.upper()

        if method in RestfulLocation._PAYLOAD_METHODS.keys():
            content_type = request.headers.get('Content-Type')
            if content_type and request.body:
                serializer = Serializer.get_for_mime_type(content_type)
                if serializer:
                    serializer = serializer(**self.serializer_kwargs)
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

            validator = getattr(
                self,
                RestfulLocation._PAYLOAD_METHODS[method],
            )
            try:
                payload = validator(payload)
            except Error as exc:
                raise HTTPBadRequest(
                    'The incoming payload failed validation (%s)' % (
                        unicode(exc),
                    )
                )

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
        self._log_request(request)

        cors_headers = {}
        if self.cors_handler:
            cors_response = self.cors_handler.handle(
                request.method,
                request.headers,
            )
            if cors_response.state == http_response.ResponseState.END:
                err = None
                if cors_response.error:
                    err = {'error': unicode(cors_response.error)}
                response = self.make_response(request, err)
                response.status = cors_response.status
                for key, value in cors_response.headers.items():
                    response.headers[key] = value
                self._log_response(response)
                return response
            else:
                cors_headers = cors_response.headers

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
            # pylint: disable=redefined-variable-type
            response = {
                'error': unicode(exc),
            }
            status = getattr(exc, 'status', 500)

        if not isinstance(response, Response):
            response = self.make_response(request, response)
            response.status = status
        for key, value in cors_headers.items():
            response.headers[key] = value

        self._log_response(response)
        return response

    def make_response(self, request, response_payload):
        """
        Creates a Response object that contains the serialized payload.

        This method is invoked when the main request handler method returns
        something that is not a Response.

        :param request: the Request object to generate the Response for
        :type request: webob.Request
        :param response_payload:
            the payload to serialize and return in the Response
        :rtype: webob.Response
        """

        serializer = self.get_response_serializer(request)

        if response_payload is not None:
            response_payload = serializer.serialize(response_payload)

        return Response(
            response_payload,
            content_type=serializer.mime_type,
        )

    def _log_request(self, request):
        self._request_logger.debug(
            u'%s %s',
            request.method,
            request.path_qs,
        )
        for name, value in request.headers.items():
            self._request_logger.debug(
                u'%s: %s',
                name,
                value,
            )
        if request.body:
            self._request_logger.info(request.body)

    def _log_response(self, response):
        self._response_logger.debug(response.status)
        for name, value in response.headers.items():
            self._response_logger.debug(
                u'%s: %s',
                name,
                value,
            )
        if response.body:
            self._response_logger.info(response.body)

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

    def _get_supported_methods(self):
        return [
            meth
            for meth, func_name in RestfulLocation._METHOD_MAP.items()
            if getattr(self, func_name, None)
        ]

    def _options_handler(self, request, **kwargs):
        # pylint: disable=unused-argument

        allowed = ['OPTIONS'] + self._get_supported_methods()

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

            # Remove unsupported features from the base.
            bad_base_features = [
                'retrieve',
                'update',
                'update_payload_validator',
                'delete',
            ]
            for attr in bad_base_features:
                if attr in base_attrs:
                    del base_attrs[attr]

            # Turn the 'list' method into a 'retrieve' on the base.
            if 'list' in base_attrs:
                base_attrs['retrieve'] = base_attrs['list']
                del base_attrs['list']
                delattr(cls, 'list')

            # Remove unsupported features from the detail.
            bad_detail_features = [
                'create',
                'create_payload_validator',
            ]
            for attr in bad_detail_features:
                if attr in base_attrs:
                    delattr(cls, attr)

            # Set up the base's prefixed features.
            prefixed_features = [
                'path',
                'parameters',
            ]
            for attr in prefixed_features:
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

