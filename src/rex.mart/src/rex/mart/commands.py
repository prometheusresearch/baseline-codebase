#
# Copyright (c) 2015, Prometheus Research, LLC
#


import urllib

from functools import partial

from cachetools import LRUCache

from webob.exc import HTTPUnauthorized, HTTPNotFound, HTTPMethodNotAllowed, \
    HTTPForbidden

from rex.core import IntVal, StrVal, OneOfVal, RecordVal, BoolVal, Error, \
    get_settings, get_rex
from rex.restful import RestfulLocation
from rex.web import HandleLocation, authenticate, Parameter

from .config import get_definition
from .connections import get_mart_db
from .permissions import MartAccessPermissions
from .quota import MartQuota


__all__ = (
    'MartResource',
    'SpecificMartLocation',
    'SpecificMartApiLocation',
    'DefinitionResource',
    'DefinitionDetailResource',
    'DefinitionMartLocation',
    'DefinitionMartApiLocation',
)


# pylint: disable=unused-argument,no-self-use,abstract-method


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


def render_definition(definition):
    return {
        'id': definition['id'],
        'label': definition['label'],
        'description': definition['description'],
    }


class DefinitionResource(RestfulLocation):
    """
    A Resource API endpoint that returns a list of all Definitions the current
    user is allowed to access.
    """

    #:
    path = '/definition'

    def retrieve(self, request, **params):
        user = authenticate(request)
        mart_access = MartAccessPermissions.top()
        definitions = mart_access.get_definitions_for_user(user)
        response = {
            'definitions': [
                render_definition(definition)
                for definition in definitions
            ],
        }
        return response


class DefinitionDetailResource(RestfulLocation):
    """
    A Resource API that returns a list of all Marts of the specified Definition
    ID the user is allowed to access, or requests the creation of a new Mart.
    """

    #:
    path = '/definition/{definition_id}'
    parameters = (
        Parameter('definition_id', StrVal()),
    )

    create_payload_validator = RecordVal(
        ('purge_on_failure', BoolVal(), True),
        ('leave_incomplete', BoolVal(), False),
    )

    def create(self, request, definition_id, **params):
        user = authenticate(request)

        if not MartAccessPermissions.top().user_can_access_definition(
                user,
                definition_id):
            raise HTTPUnauthorized
        if not get_settings().mart_allow_runtime_creation:
            raise HTTPForbidden('Runtime Mart creation is not allowed')

        definition = get_definition(definition_id)
        if not MartQuota.top().can_create_mart(user, definition):
            raise HTTPForbidden(
                'Creating a Mart of this Definition would violate your'
                ' Quota'
            )

        payload = request.payload._asdict()
        payload['owner'] = user
        payload['definition'] = definition_id

        from rex.asynctask import get_transport
        transport = get_transport()
        transport.submit_task(
            get_settings().mart_runtime_creation_queue,
            payload,
        )

        response = self.make_response(request, payload)
        response.status = 202
        return response

    def retrieve(self, request, definition_id, **params):
        user = authenticate(request)
        mart_access = MartAccessPermissions.top()
        marts = mart_access.get_marts_for_user(
            user,
            definition_id=definition_id,
        )
        response = {
            'definition': render_definition(get_definition(definition_id)),
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

        rex = get_rex()
        if not hasattr(rex, 'mart_databases'):
            rex.mart_databases = LRUCache(
                maxsize=get_settings().mart_htsql_cache_depth,
                missing=get_mart_db,
            )
        htsql = rex.mart_databases[str(mart.name)]

        # If the tweak.shell extension is enabled for this HTSQL instance,
        # then we need to set an appropriate value for the server_root
        # property so that the shell can find its static assets.
        server_root = None
        if hasattr(htsql, 'tweak') and hasattr(htsql.tweak, 'shell'):
            base_path = self.get_base_path(request)
            idx = request.path_url.find(base_path)
            server_root = request.path_url[:(idx + len(base_path))]
            htsql.tweak.shell.server_root = server_root

        proxied_request = self.proxy_request(request)
        response = proxied_request.get_response(htsql)

        if get_settings().debug and server_root:
            response.headers['X-Htsql-Shell-Root'] = server_root

        return response

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

    def get_base_path(self, request):
        return self.split_url(request)[0]

    def get_query(self, request):
        return self.split_url(request)[1]

    def split_url(self, request):
        raise NotImplementedError()


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

    def split_url(self, request):
        # pylint: disable=no-self-use
        idx = 6 + request.path_info[6:].index('/')
        return request.path_info[:idx], request.path_info[idx:]


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

    def split_url(self, request):
        # pylint: disable=no-self-use
        idx = 0
        hits = 4
        while idx >= 0 and hits > 1:
            idx = request.path_info.find('/', (idx + 1))
            hits -= 1
        return request.path_info[:idx], request.path_info[idx:]

