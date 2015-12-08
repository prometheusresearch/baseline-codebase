#
# Copyright (c) 2015, Prometheus Research, LLC
#


import urllib

from functools import partial

from rex.core import IntVal, StrVal, OneOfVal, RecordVal, BoolVal, Error
from rex.restful import RestfulLocation, SimpleResource
from rex.web import HandleLocation, authenticate, Parameter
from webob.exc import HTTPUnauthorized, HTTPNotFound, HTTPMethodNotAllowed

from .connections import get_mart_db
from .permissions import MartAccessPermissions


__all__ = (
    'MartResource',
    'SpecificMartLocation',
    'SpecificMartApiLocation',
    'DefinitionResource',
    'DefinitionMartLocation',
    'DefinitionMartApiLocation',
)


# pylint: disable=unused-argument,no-self-use


class MartResource(RestfulLocation):
    """
    An API endpoint that returns a list of all Marts the current user is
    allowed to access.
    """

    #:
    path = '/mart'

    def retrieve(self, request, **param):
        user = authenticate(request)
        mart_access = MartAccessPermissions.top()
        marts = mart_access.get_marts_for_user(user)
        response = {
            'marts': [
                mart.as_dict()
                for mart in marts
            ],
        }
        return response


class DefinitionResource(SimpleResource):
    """
    A Resource API endpoint that returns a list of all Definitions the current
    user is allowed to access, or, if a Definition ID is specified, returns a
    list of all Marts of the specified Definition ID the user is allowed to
    access.
    """

    #:
    base_path = '/definition'
    #:
    path = '/definition/{definition_id}'
    parameters = (
        Parameter('definition_id', StrVal()),
    )

    def list(self, request, **params):
        user = authenticate(request)
        mart_access = MartAccessPermissions.top()
        definitions = mart_access.get_definitions_for_user(user)
        response = {
            'definitions': [
                definition
                for definition in definitions
            ],
        }
        return response

    def retrieve(self, request, definition_id, **params):
        user = authenticate(request)
        mart_access = MartAccessPermissions.top()
        marts = mart_access.get_marts_for_user(
            user,
            definition_id=definition_id,
        )
        response = {
            'marts': [
                mart.as_dict()
                for mart in marts
            ],
        }
        return response


class MartApiLocation(RestfulLocation):
    def __init__(self, *args, **kwargs):
        super(MartApiLocation, self).__init__(*args, **kwargs)
        self.mart_access = MartAccessPermissions.top()

    def _do_retrieve(self, request, mart_getter):
        user = authenticate(request)
        mart = mart_getter(user)
        return mart.as_dict()

    update_payload_validator = RecordVal(
        ('pinned', BoolVal()),
    )

    def _do_update(self, request, mart_getter):
        user = authenticate(request)
        mart = mart_getter(user)
        if not self.mart_access.user_can_manage_mart(user, mart):
            raise HTTPUnauthorized()
        mart.pinned = request.payload.pinned
        return mart.as_dict()

    def _do_delete(self, request, mart_getter):
        user = authenticate(request)
        mart = mart_getter(user)
        if not self.mart_access.user_can_manage_mart(user, mart):
            raise HTTPUnauthorized()
        mart.purge()


class SpecificMartApiLocation(MartApiLocation):
    """
    An API endpoint that allows the following operations on the specified Mart:

    * GET: Retrieves basic information about the Mart
    * PUT: Updates the ``pinned`` status of the Mart
    * DELETE: Purges the Mart from the system
    """

    #:
    path = '/mart/{mart_id}/_api'
    parameters = (
        Parameter('mart_id', IntVal()),
    )

    def get_mart(self, mart_id, user):
        mart = self.mart_access.get_mart(mart_id, user)
        if mart is None:
            raise HTTPNotFound()
        elif mart is False:
            raise HTTPUnauthorized()
        return mart

    def retrieve(self, request, mart_id, **params):
        return self._do_retrieve(request, partial(self.get_mart, mart_id))

    def update(self, request, mart_id, **params):
        return self._do_update(request, partial(self.get_mart, mart_id))

    def delete(self, request, mart_id, **params):
        return self._do_delete(request, partial(self.get_mart, mart_id))


class DefinitionMartApiLocation(MartApiLocation):
    """
    An API endpoint that allows the following operations on the specified Mart:

    * GET: Retrieves basic information about the Mart
    * PUT: Updates the ``pinned`` status of the Mart
    * DELETE: Purges the Mart from the system
    """

    #:
    path = '/definition/{definition_id}/{latest_or_index}/_api'
    parameters = (
        Parameter('definition_id', StrVal()),
        Parameter('latest_or_index', OneOfVal(IntVal(1), StrVal(r'^latest$'))),
    )

    def get_mart(self, definition_id, latest_or_index, user):
        marts = self.mart_access.get_marts_for_user(
            user,
            definition_id=definition_id,
        )
        if marts is False:
            raise HTTPUnauthorized()
        elif len(marts) == 0:
            raise HTTPNotFound()

        if latest_or_index == 'latest':
            return marts[0]
        else:
            if len(marts) < latest_or_index:
                raise HTTPNotFound()
            return marts[latest_or_index - 1]

    def retrieve(self, request, definition_id, latest_or_index, **params):
        return self._do_retrieve(
            request,
            partial(self.get_mart, definition_id, latest_or_index),
        )

    def update(self, request, definition_id, latest_or_index, **params):
        return self._do_update(
            request,
            partial(self.get_mart, definition_id, latest_or_index),
        )

    def delete(self, request, definition_id, latest_or_index, **params):
        return self._do_delete(
            request,
            partial(self.get_mart, definition_id, latest_or_index),
        )


class MartLocation(HandleLocation):
    def __init__(self, *args, **kwargs):
        super(MartLocation, self).__init__(*args, **kwargs)
        self.mart_access = MartAccessPermissions.top()

    def __call__(self, request):
        mart = self.get_mart(request)
        database = get_mart_db(str(mart.name))
        proxied_request = self.proxy_request(request)
        return proxied_request.get_response(database)

    def proxy_request(self, request):
        proxy = request.copy()

        # If it's a POST, transform it to an HTSQL-friendly GET
        if request.method == 'POST':
            path_info = request.body
            query_string = ''
            if '?' in path_info:
                path_info, query_string = path_info.split('?', 1)
            path_info = urllib.unquote(path_info)
            proxy.method = 'GET'
            proxy.path_info = path_info
            proxy.query_string = query_string

        elif request.method == 'GET':
            proxy.path_info = self.get_query(request)

        else:
            raise HTTPMethodNotAllowed()

        return proxy

    def get_path_args(self, request):
        args = self.path(request.path_info)
        try:
            args = self.path_args_validator(args)
        except Error:
            raise HTTPNotFound()
        return args


class SpecificMartLocation(MartLocation):
    """
    An HTSQL endpoint for the specified Mart.
    """

    #:
    path = '/mart/{mart_id}/**'
    path_args_validator = RecordVal(
        ('mart_id', IntVal()),
    )

    def get_mart(self, request):
        user = authenticate(request)
        args = self.get_path_args(request)
        mart = self.mart_access.get_mart(args.mart_id, user)
        if mart is None:
            raise HTTPNotFound()
        elif mart is False:
            raise HTTPUnauthorized()

        return mart

    def get_query(self, request):
        # pylint: disable=no-self-use
        idx = 6 + request.path_info[6:].index('/')
        return request.path_info[idx:]


class DefinitionMartLocation(MartLocation):
    """
    An HTSQL endpoint for the specified Mart.
    """

    #:
    path = '/definition/{definition_id}/{latest_or_index}/**'
    path_args_validator = RecordVal(
        ('definition_id', StrVal()),
        ('latest_or_index', OneOfVal(IntVal(1), StrVal(r'^latest$'))),
    )

    def get_mart(self, request):
        user = authenticate(request)
        args = self.get_path_args(request)

        marts = self.mart_access.get_marts_for_user(
            user,
            definition_id=args.definition_id,
        )
        if marts is False:
            raise HTTPUnauthorized()
        elif len(marts) == 0:
            raise HTTPNotFound()

        if args.latest_or_index == 'latest':
            return marts[0]
        else:
            if len(marts) < args.latest_or_index:
                raise HTTPNotFound()
            return marts[args.latest_or_index - 1]

    def get_query(self, request):
        # pylint: disable=no-self-use
        start = 0
        hits = 4
        while start >= 0 and hits > 1:
            start = request.path_info.find('/', (start + 1))
            hits -= 1
        return request.path_info[start:]

