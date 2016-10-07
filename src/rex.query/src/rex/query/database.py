#
# Copyright (c) 2016, Prometheus Research, LLC
#


from webob import Response
from webob.exc import HTTPMethodNotAllowed, HTTPBadRequest
from rex.core import Error
from rex.db import get_db
from .query import QueryVal
from .bind import RexBindingState
from .catalog import produce_catalog
from htsql import HTSQL
from htsql.core.cmd.act import produce
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers
from htsql.core.tr.translate import translate
import json


class Database(object):

    def __init__(self, db=None, ignore_catalog_entities=None):
        if not isinstance(db, HTSQL):
            db = get_db(db)
        self.db = db
        self.ignore_catalog_entities = ignore_catalog_entities

    parse = QueryVal()

    def translate(self, query):
        query = self.parse(query)
        with self.db:
            state = RexBindingState()
            binding = state(query)
            plan = translate(binding, limit=query.limit, offset=query.offset)
        return plan

    def produce(self, query):
        query = self.parse(query)
        with self.db:
            if query.is_catalog():
                return produce_catalog(
                    ignore_entities=self.ignore_catalog_entities,
                )
            pipe = self.translate(query)
            return pipe()(None)

    def describe(self, query):
        query = self.parse(query)
        with self.db:
            if query.is_catalog():
                return produce_catalog(
                    ignore_entities=self.ignore_catalog_entities,
                )
            pipe = self.translate(query)
            return Product(pipe.meta, None)

    def __call__(self, req):
        if req.method != 'POST':
            raise HTTPMethodNotAllowed()
        try:
            data = json.loads(req.body)
        except ValueError, exc:
            raise HTTPBadRequest(str(exc))
        try:
            query = self.parse(data)
        except Error, exc:
            raise HTTPBadRequest(str(exc))
        with self.db:
            if query.is_catalog():
                product = produce_catalog(
                    ignore_entities=self.ignore_catalog_entities,
                )
            else:
                pipe = self.translate(query)
                product = pipe()(None)
            format = query.format or accept(req.environ)
            headerlist = emit_headers(format, product)
            app_iter = list(emit(format, product))
            return Response(headerlist=headerlist, app_iter=app_iter)

