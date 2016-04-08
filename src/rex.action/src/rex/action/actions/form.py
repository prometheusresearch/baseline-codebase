"""

    rex.action.actions.form
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property
from webob.exc import HTTPBadRequest

from rex.core import Error, StrVal, OneOfVal, MapVal, AnyVal
from rex.db import Query
from rex.port import Port
from rex.widget import (
    Field, undefined, FormFieldsetVal, responder, QueryURL,
    Mutation, MutationURL, computed_field)
from rex.widget.validate import DeferredVal, Deferred
from rex.widget.port_support import PortSupport

from ..action import Action
from ..typing import RecordTypeVal, RecordType, RowTypeVal, annotate_port
from ..validate import RexDBVal, SyntaxVal

__all__ = ('Form',)


class Form(Action):
    """ Form action.

    This is an action which renders a form.

    Example action declaration::

          type: form
          input:
          - individual: individual
          fields:
          - type: string
            value_key: first_name
          - type: string
            value_key: last_name
          value:
            /individuals[$individual]{
                first_name := first_name,
                last_name := last_name
            }
          query:
            update(/individual[$individual] := {
                id(),
                first_name := $first_name
                last_name := $last_name
            })

    Notice that ``value`` field is used to define an initial value and ``query``
    - to define how to persist form values in database.
    """

    name = 'form'
    js_type = 'rex-action/lib/actions/Form'

    class Configuration(Action.Configuration):

        def _resolve_fields(self, input, fields):
            if isinstance(fields, Deferred):
                parameters = {k: None for k in input.rows.keys()}
                with PortSupport.parameters(parameters):
                    fields = fields.resolve()
            return fields

        def override(self, action, values):
            if 'fields' in values:
                fields = values['fields']
                input = values.get('input') or action.input
                values['fields'] = self._resolve_fields(input, fields)
            return action.__validated_clone__(**values)

        def __call__(self, action_class, values):
            fields = values['fields']
            input = values['input']
            values['fields'] = self._resolve_fields(input, fields)
            return action_class.validated(**values)

    def __init__(self, **values):
        super(Form, self).__init__(**values)
        if self.value is None and self.query is None:
            raise Error('Either value or query should be provided')

    input = Field(
        RecordTypeVal(), default=RecordType.empty())

    fields = Field(
        DeferredVal(FormFieldsetVal()),
        doc="""
        A list of fields to show.

        If not specified then it will be generated automatically based on the
        data schema.
        """)

    query = Field(
        SyntaxVal(), transitionable=False,
        default=None,
        doc="""
        Query which is used to persist data in database.
        """)

    entity = Field(
        RowTypeVal(),
        default=None,
        doc="""
        Name and type of the entity this form action puts into context on
        success.

        If this is defined then query should return a record of shape::

            { id := ...}

        which is used to fetch entity.
        """)

    value = Field(
        OneOfVal(SyntaxVal(), MapVal(StrVal(), AnyVal())),
        default=None,
        doc="""
        Initial form value.

        Can be specified either as an HTSQL query or an object literal which can
        reference context values.
        """)

    db = Field(
        RexDBVal(), default=None,
        transitionable=False,
        doc="""
        Database to use.
        """)

    submit_button = Field(
        StrVal(), default=undefined,
        doc="""
        Text for submit button.
        """)

    @computed_field
    def read_only(self, req):
        return self.query is None

    @cached_property
    def mutation(self):
        """ Define data mutation for the action."""
        if self._data_query is None:
            return None
        return Mutation(port=self._port, query=self._data_query)

    @responder(url_type=MutationURL)
    def data_mutation(self, req):
        """ Handle data mutation request."""
        if self.mutation is None:
            raise HTTPBadRequest('form action is configured as read-only')
        return self.mutation(req)

    @responder(url_type=QueryURL)
    def data_value(self, req):
        if not isinstance(self.value, basestring):
            raise HTTPBadRequest('value is not provided via HTSQL query')
        return self._data_value(req)

    def context(self):
        if self.entity:
            return self.input, self.domain.record(self.entity)
        else:
            return self.input, self.domain.record()

    @cached_property
    def _port(self):
        if self.entity is None:
            return None
        parameters = [{'parameter': k, 'default': None}
                      for k in self.context_types.input.rows]
        port = Port(parameters + [{
            'entity': self.entity.type.name,
            'select':[]
        }])
        port = annotate_port(self.domain, port)
        return port

    @cached_property
    def _data_value(self):
        return self._create_query(self.value)

    @cached_property
    def _data_query(self):
        if self.query is None:
            return None
        return self._create_query(self.query, define_fields=True)

    def _create_query(self, query, define_fields=False):
        query = Query(query, db=self.db)
        query.parameters = {}
        query.parameters.update({k: None for k in self.context_types.input.rows})
        if define_fields:
            query.parameters.update({f.value_key[0]: None for f in self.fields})
        return query
