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
from htsql.core.domain import Product
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

    def translate(self, query, values):
        query = self.parse(query)
        with self.db:
            state = RexBindingState(values=values)
            binding = state(query)
            plan = translate(binding, limit=query.limit, offset=query.offset)
        return plan

    def produce(self, query, values=None):
        query = self.parse(query)
        with self.db:
            if query.is_catalog():
                return produce_catalog(
                    ignore_entities=self.ignore_catalog_entities,
                )
            pipe = self.translate(query, values=values)
            product = pipe()(None)
            return product

    def describe(self, query, values=None):
        query = self.parse(query)
        with self.db:
            if query.is_catalog():
                return produce_catalog(
                    ignore_entities=self.ignore_catalog_entities,
                )
            pipe = self.translate(query, values=values)
            return Product(pipe.meta, None)

    def __call__(self, req):
        if req.method != 'POST':
            raise HTTPMethodNotAllowed()
        try:
            data = json.loads(req.body)
        except ValueError as exc:
            raise HTTPBadRequest(str(exc))
        try:
            query = self.parse(data)
        except Error as exc:
            raise HTTPBadRequest(str(exc))
        with self.db:
            if query.is_catalog():
                product = produce_catalog(
                    ignore_entities=self.ignore_catalog_entities,
                )
            else:
                pipe = self.translate(query, values=None)
                if 'dry-run' in req.GET:
                    product = Product(pipe.meta, None)
                else:
                    product = pipe()(None)
            format = query.format or accept(req.environ)
            headerlist = emit_headers(format, product)
            app_iter = list(emit(format, product))
            return Response(headerlist=headerlist, app_iter=app_iter)

