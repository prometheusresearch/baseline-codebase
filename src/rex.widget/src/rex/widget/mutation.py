"""

    rex.widget.mutation
    ===================

    This module provides :class:`Mutation`, a special class of HTSQL queries
    which mutate an entity in database and return it.

    :copyright: 2015, Prometheus Research, LLC

"""

import json

from htsql.core.cmd.act import produce
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers

from webob import Response
from webob.exc import (
    HTTPError, HTTPMethodNotAllowed, HTTPBadRequest,
    HTTPInternalServerError)

from rex.core import Error
from rex.web import authenticate

__all__ = ('Mutation',)


class Mutation(object):
    """ A pair of related HTSQL query and port.

    Query is used to mutate db and then port to re-fetch the needed data.
    """

    def __init__(self, port=None, query=None):
        if not port and not query:
            raise TypeError('Either port or query should be provided')
        self.port = port
        self.query = query

    def _query_params(self, req):
        if not 'new' in req.POST:
            raise HTTPBadRequest('missing "new" field in request')
        try:
            params = json.loads(req.POST['new'])
        except ValueError:
            raise HTTPBadRequest(
                'invalid request payload, "new" field should'
                ' contain a valid JSON object')
        if not params:
            raise HTTPBadRequest(
                'invalid request payload, "new" field should'
                ' contain a valid JSON object with a single key')
        if isinstance(params, dict):
            params = next(iter(params.values()))
            if not params:
                raise HTTPBadRequest(
                    'invalid request payload, "new" field should'
                    ' contain a valid JSON object with a single key with'
                    ' a non-empty list as a value')
        query_params = {}
        query_params.update({
            k[1:]: v for k, v in list(req.GET.items())
            if k.startswith(':')
        })
        query_params.update({
            k: v for k, v in list(params[0].items())
            if not k.startswith('meta:') and k != 'id'
        })
        return self.query._merge(query_params)

    def __call__(self, req):
        if not req.method == 'POST':
            raise HTTPMethodNotAllowed()

        # If we don't have query for mutation we just run port
        if not self.query:
            return self.port(req)

        # See :class:`rex.db.Query` for more details
        try:
            with self.query.get_db():
                result = produce(self.query.query, self._query_params(req))
        except (Error, HTTPError) as error:
            return req.get_response(error)

        if not self.port:
            return Response(json=None)

        if not hasattr(result.data, 'id'):
            raise HTTPInternalServerError(
                'query should return a record with an id field: { id := ...  }')

        # Fetch update entity assuming query returns id of the update entity.
        params = {k[1:]: v for k, v in list(req.GET.items()) if k.startswith(':')}
        # Coercion to str is neccessary, otherwise querying port fails
        product = self.port.produce('*=%s' % str(result.data.id), **params)

        # See :class:`rex.db.Port` for more details
        with self.port.db:
            format = product.format or accept(req.environ)
            headerlist = emit_headers(format, product)
            app_iter = list(emit(format, product))
            return Response(headerlist=headerlist, app_iter=app_iter)
