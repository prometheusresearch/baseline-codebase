#
# Copyright (c) 2016, Prometheus Research, LLC
#

import json

from webob import Response

from htsql.core.fmt.emit import emit, emit_headers
from rex.action import typing
from rex.core import RecordVal, StrVal, MaybeVal, SeqVal
from rex.db import Query
from rex.widget import responder, RequestURL
from rex.query import Database

from .filter import MartFilteredAction
from .tool import MartTool


__all__ = (
    'QueryBuilderTool',
    'QueryBuilderMartAction',
)


class QueryBuilderTool(MartTool):
    name = 'vqb'

    @classmethod
    def is_enabled_for_mart(cls, mart):
        # return 'datadictionary' in mart.definition['processors']
        return True


class QueryBuilderMartAction(MartFilteredAction):
    name = 'mart-query-builder'
    js_type = 'rex-mart-actions', 'QueryBuilder'
    tool = 'vqb'

    def context(self):
        return {'mart': typing.number}, {}

    @responder(url_type=RequestURL)
    def run_query(self, req):
        mart = self.get_mart(req)
        ignore = []
        cfg = self.get_mart_dictionary(mart)
        if cfg:
            ignore = [
                cfg['table_name_tables'],
                cfg['table_name_columns'],
                cfg['table_name_enumerations'],
            ]
        database = Database(mart.get_htsql(), ignore_catalog_entities=ignore)
        return database(req)

    validate_filter_body = RecordVal(
        ('table', MaybeVal(StrVal())),
        ('search_term', StrVal()),
        ('relation_list', SeqVal(RecordVal(
            ('label', MaybeVal(StrVal())),
            ('value', StrVal())))),
    )

    @responder(url_type=RequestURL)
    def filter_relation_list(self, req):
        search = self.validate_filter_body(json.loads(req.body))

        table = search['table']
        search_term = search['search_term']

        mart = self.get_mart(req)
        cfg = self.get_mart_dictionary(mart)
        database = mart.get_htsql()

        if not cfg:
            query = '{resultList := null()}'

        elif table is None:
            query = """
            {
                resultList := /%s {
                        value := name,
                        label := title
                    }
                    .filter(
                        name~$search_term |
                        ft_matches(title, $search_term) |
                        ft_matches(description, $search_term)
                    )
            }
            """ % (cfg['table_name_tables'],)

        else:
            query = """
            {
                resultList := /%s {
                        value := name,
                        label := title
                    }
                    .filter(
                        table = $table
                    )
                    .filter(
                        name~$search_term |
                        ft_matches(title, $search_term) |
                        ft_matches(description, $search_term) |
                        ft_matches(source, $search_term) |
                        datatype~$search_term
                    )
            }
            """ % (cfg['table_name_columns'],)

        product = Query(
            query,
            db=database,
            parameters={'search_term': search_term, 'table': table}
        ).produce()

        headerlist = emit_headers('application/json', product)
        app_iter = list(emit('application/json', product))

        return Response(headerlist=headerlist, app_iter=app_iter)

