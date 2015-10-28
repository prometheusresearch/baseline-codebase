"""

    rex.action.mutation
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
from webob.exc import HTTPError, HTTPMethodNotAllowed, HTTPBadRequest

from rex.core import Error
from rex.web import authenticate

__all__ = ('Mutation',)


class Mutation(object):
    """ A pair of related HTSQL query and port.

    Query is used to mutate db and then port to re-fetch the needed data.
    """

    def __init__(self, port, query=None):
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
        params = params.itervalues().next()
        if not params:
            raise HTTPBadRequest(
                'invalid request payload, "new" field should'
                ' contain a valid JSON object with a single key with'
                ' a non-empty list as a value')
        params = params[0]
        params = {k: v for k, v in params.items()
                  if not k.startswith('meta:') and k != 'id'}
        return self.query._merge(params)

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
        except (Error, HTTPError), error:
            return req.get_response(error)

        if not hasattr(result.data, 'id'):
            raise HTTPInternalServerError('Query configured incorrectly')

        # Fetch update entity assuming query returns id of the update entity.
        # XXX: coercion to str is neccessary, otherwise querying port fails
        product = self.port.produce('individual=%s' % str(result.data.id))

        # See :class:`rex.db.Port` for more details
        with self.port.db:
            format = product.format or accept(req.environ)
            headerlist = emit_headers(format, product)
            app_iter = list(emit(format, product))
            return Response(headerlist=headerlist, app_iter=app_iter)
