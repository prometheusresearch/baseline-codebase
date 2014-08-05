#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob import Response
from webob.exc import HTTPMethodNotAllowed, HTTPException

from rex.core import cached, StrVal
from rex.web import Command, Parameter

from .serializer import Serializer


__all__ = (
    'RestfulLocation',
)


# pylint: disable=W0223
class RestfulLocation(Command):
    priority = 1000
    access = 'authenticated'
    default_format = 'json'

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

    @classmethod
    @cached
    def all(cls):
        extensions = [
            extension
            for extension in Command.all()
            if issubclass(extension, RestfulLocation)
        ]
        return sorted(extensions, key=lambda e: e.priority)

    def get_response_serializer(self, request):
        for mime_type in request.accept:
            serializer = Serializer.get_for_mime_type(mime_type)
            if serializer:
                return serializer()

        fmt = request.GET.get('format') or self.default_format
        serializer = Serializer.get_for_format(fmt)
        return serializer()

    def parse_payload(self, request):
        content_type = None
        payload = {}

        if request.method.upper() in ('POST', 'PUT'):
            content_type = request.headers.get('Content-Type')
            if content_type:
                serializer = Serializer.get_for_mime_type(content_type)
                if serializer:
                    serializer = serializer()
                    content_type = serializer.mime_type
                    payload = serializer.deserialize(request.body)

        # TODO: we should be able to validate the payload
        # in the same sort of way that we validate the parameters.

        return payload, content_type

    class _FakeRequest(object):
        def __init__(self, request):
            self.params = request.params
            self.path_info = request.path_info

    def parse_arguments(self, request):
        # We want to use the logic within self.parse(), but we only want it
        # to operate on GET variables, not POST. So, until self.parse() is
        # refactored a little bit, we'll sending it a mock request.
        return self.parse(RestfulLocation._FakeRequest(request))

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
    def _options_handler(self, request, **kwarg):
        allowed = ['OPTIONS']

        for meth, func_name in RestfulLocation._METHOD_MAP.items():
            if getattr(self, func_name, None):
                allowed.append(meth)

        response = Response()
        response.headers['Allow'] = ', '.join(allowed)

        return response

    def render(self, req, **arguments):
        raise NotImplementedError("%s.render()" % self.__class__.__name__)

