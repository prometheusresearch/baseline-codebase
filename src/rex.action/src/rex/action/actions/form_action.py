"""

    rex.action.actions.form_action
    ==============================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import StrVal, AnyVal, MapVal
from rex.db import Query
from rex.widget import formfield, dataspec
from rex.widget import Field, QueryURL, PortURL, MutationURL, responder, Mutation

from ..validate import SyntaxVal
from .entity_action import EntityAction

__all__ = ('FormAction',)


def create_fieldset_from_value(value, _key=None):
    _key = _key or ['__root__']
    if isinstance(value, dict):
        return formfield.Fieldset(
            value_key=_key,
            fields=[create_fieldset_from_value(v, _key=[k]) for k, v in value.items()])
    elif isinstance(value, list):
        merged = {}
        for item in value:
            merged.update(item)
        return formfield.List(
            value_key=_key,
            fields=[create_fieldset_from_value(v, _key=[k]) for k, v in merged.items()])
    else:
        return formfield.StringFormField(value_key=_key)


def remove_fields_layout(fields):
    no_layout = []
    for f in fields:
        if isinstance(f, formfield.FormLayoutItem):
            no_layout = no_layout + remove_fields_layout(f.fields)
        else:
            no_layout.append(f)
    return no_layout


class FormAction(EntityAction):
    """ Base class for actions which represent an entity form."""

    value = Field(
        MapVal(StrVal(), AnyVal()), default={},
        doc="""
        An initial value.

        It could reference data from the current context via ``$name``
        references::

            study: $study
            individual: $individual

        """)

    query = Field(
        SyntaxVal(), default=None, transitionable=False,
        doc="""
        Optional query which is used to persist data in database.
        """)

    @cached_property
    def mutation(self):
        """ Define data mutation for the action."""
        return Mutation(self.port, query=self.create_query())

    @responder(url_type=MutationURL)
    def data_mutation(self, req):
        """ Handle data mutation request."""
        return self.mutation(req)

    def create_query(self):
        if self.query:
            query = Query(self.query, self.db)
            query.parameters = {f.value_key[0]: None for f in self._complete_fields}
            return query
        else:
            return None

    def create_port(self, fields=None, filters=None, mask=None, entity=None):
        """ Override port creation and inject coplete list of fields."""
        if fields is None:
            fields = self._complete_fields
        return super(FormAction, self).create_port(fields=fields,
                                                   filters=filters,
                                                   mask=mask,
                                                   entity=entity)

    @cached_property
    def _complete_fields(self):
        """ Complete list of fields for form action.

        A list of fields which contains both user defined fields and fields
        which are inferred from initial form value.

        We use this to construct form and query parameters.
        """
        fields = create_fieldset_from_value(self.value).fields
        fields = formfield.enrich(fields, self.entity.type.name, db=self.db)
        fields = fields + self.fields
        fields = remove_fields_layout(fields)
        return fields
