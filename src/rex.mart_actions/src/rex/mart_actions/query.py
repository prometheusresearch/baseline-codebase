#
# Copyright (c) 2016, Prometheus Research, LLC
#

from rex.widget import Field, responder, RequestURL
from .base import MartAction
from rex.action import typing
from rex.query import Database

class MartQueryBuilder(MartAction):

    name = 'mart-query-builder'
    js_type = 'rex-mart-actions/lib/QueryBuilder'

    def context(self):
        return {'mart': typing.number}, {}

    @responder(url_type=RequestURL)
    def run_query(self, req):
        mart = self.get_mart(req)
        ignore = []
        for proc in mart.definition['processors']:
            if proc['id'] == 'datadictionary':
                ignore = [
                    proc['options']['table_name_tables'],
                    proc['options']['table_name_columns'],
                    proc['options']['table_name_enumerations'],
                ]
                break
        database = Database(mart.get_htsql(), ignore_catalog_entities=ignore)
        return database(req)

