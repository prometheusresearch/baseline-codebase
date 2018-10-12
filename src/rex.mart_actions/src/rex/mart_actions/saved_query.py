import json
from webob import Response
from rex.core import cached
from rex.core import RecordVal, StrVal, MaybeVal, SeqVal, IntVal
from rex.action import typing
from rex.action.actions.form_action import FormAction
from rex.widget import (Field, computed_field, responder, PortURL, RequestURL,
                        QueryURL, MutationURL, Mutation, FormFieldsetVal,
                        undefined)
from rex.db import Query
from rex.port import Port
from rex.query import Database
from rex.mart_actions import MartAction, MartFilteredAction
from rex.mart_actions.query import get_export_formats, get_chart_configs
from htsql.core.fmt.emit import emit, emit_headers

def get_database_by_mart(mart):
    ignore = []
    for proc in mart.definition['processors']:
        if proc['id'] == 'datadictionary':
            ignore = [
                proc['options']['table_name_tables'],
                proc['options']['table_name_columns'],
                proc['options']['table_name_enumerations'],
            ]
            break
    return Database(mart.get_htsql(), ignore_catalog_entities=ignore)


class MartBaseQuery(FormAction, MartAction):

    query_limit = Field(IntVal(), default=10000)

    export_formats = computed_field(get_export_formats)
    chart_configs = computed_field(get_chart_configs)
    query = Field(StrVal())

    def __init__(self, **values):
        values['fields'] = FormFieldsetVal().parse("""
        - value_key: title
        - value_key: data
        - value_key: own
        """)
        super(MartBaseQuery, self).__init__(**values)

    @responder(url_type=RequestURL)
    def run_query(self, req):
        # TODO: handle (mart is None) case
        mart = self.get_mart(req, req.GET.get('mart'))
        database = get_database_by_mart(mart)
        return database(req)

    validate_fitler_relation_list_params = RecordVal(
        ('mart', StrVal()),
    )

    validate_fitler_relation_list_body = RecordVal(
        ('table', MaybeVal(StrVal())),
        ('search_term', StrVal()),
        ('relation_list', SeqVal(RecordVal(
            ('label', MaybeVal(StrVal())),
            ('value', StrVal())))),
    )

    @responder(url_type=RequestURL)
    def filter_relation_list(self, req):
        params = self.validate_fitler_relation_list_params(dict(req.GET))
        search = self.validate_fitler_relation_list_body(json.loads(req.body))

        table = search['table']
        search_term = search['search_term']
        relation_list = search['relation_list']

        mart = self.get_mart(req, params.mart)
        database = get_database_by_mart(mart)

        if table is None:
            query = """
            {
                resultList := /datadictionary_table {
                        value := name,
                        label := title
                    }
                    .filter(
                        name~$search_term |
                        ft_matches(title, $search_term) |
                        ft_matches(description, $search_term)
                    )
            }
            """
        else:
            query = """
            {
                resultList := /datadictionary_column {
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
            """

        product = Query(
            query,
            db=database.db,
            parameters={'search_term': search_term, 'table': table}
        ).produce()

        headerlist = emit_headers('application/json', product)
        app_iter = list(emit('application/json', product))

        return Response(headerlist=headerlist, app_iter=app_iter)



class MartNewQuery(MartBaseQuery):

    name = 'mart-make-query'
    js_type = 'rex-mart-actions', 'MartMakeQuery'

    def context(self):
        input = {}
        input.update(self.input.rows)
        input.update({
            'mart': typing.RowType(name='mart', type=typing.EntityType('mart'))
        })
        return typing.RecordType(input), self.domain.record(self.entity)

    @responder(url_type=MutationURL)
    def insert_query(self, req):
        query_data = json.loads(req.POST['new'])[0]
        query = Query(self.query, parameters=query_data)
        mutation = Mutation(self.port, query)
        return mutation(req)


class MartEditQuery(MartBaseQuery):

    name = 'mart-edit-query'
    js_type = 'rex-mart-actions', 'MartEditQuery'
    clone_query = Field(StrVal(), default=None)

    def context(self):
        input = {}
        input.update(self.input.rows)
        input.update({
            'mart': typing.RowType(name='mart', type=typing.EntityType('mart'))
        })
        if not self.entity.name in input:
            input.update({self.entity.name: self.entity})
        return typing.RecordType(input), typing.RecordType([self.entity])

    @responder(url_type=MutationURL)
    def update_query(self, req):
        query_data = json.loads(req.POST['new'])[0]
        query = Query(self.query, parameters=query_data)
        mutation = Mutation(self.port, query)
        return mutation(req)

    @responder(url_type=MutationURL)
    def insert_query(self, req):
        query_data = json.loads(req.POST['new'])[0]
        query = Query(self.clone_query, parameters=query_data)
        mutation = Mutation(self.port, query)
        return mutation(req)


class ConsoleQueryAction(MartFilteredAction):
    """
    Base for HTSQL console actions.
    """

    entity = Field(typing.RowTypeVal())
    query = Field(StrVal())

    @property
    @cached
    def port(self):
        return typing.annotate_port(self.domain, Port("""
        entity: %s
        select: [id, title, data]
        """ % self.entity.type.name))

    @responder(url_type=PortURL)
    def fetch_query(self, req):
        return self.port(req)


class MartMakeConsoleQuery(ConsoleQueryAction):
    """
    An HTSQL console to create a saved query.
    """

    name = 'mart-make-console-query'
    js_type = 'rex-mart-actions', 'MartMakeConsoleQuery'
    tool = 'htsql'

    def context(self):
        return self.input, self.domain.record(self.entity)

    @responder(url_type=MutationURL)
    def insert_query(self, req):
        query_data = json.loads(req.POST['new'])[0]
        query = Query(self.query, parameters=query_data)
        mutation = Mutation(self.port, query)
        return mutation(req)


class MartEditConsoleQuery(ConsoleQueryAction):
    """
    An HTSQL console to edit a saved query.
    """

    name = 'mart-edit-console-query'
    js_type = 'rex-mart-actions', 'MartEditConsoleQuery'
    tool = 'htsql'
    clone_query = Field(StrVal(), default=None)

    def context(self):
        input = self.input
        if not self.entity.name in input.rows:
            input = typing.RecordType(list(input.rows.values()) + [self.entity])
        return input, typing.RecordType([self.entity])

    @responder(url_type=MutationURL)
    def update_query(self, req):
        query_data = json.loads(req.POST['new'])[0]
        query = Query(self.query, parameters=query_data)
        mutation = Mutation(self.port, query)
        return mutation(req)

    @responder(url_type=MutationURL)
    def insert_query(self, req):
        query_data = json.loads(req.POST['new'])[0]
        query = Query(self.clone_query, parameters=query_data)
        mutation = Mutation(self.port, query)
        return mutation(req)
