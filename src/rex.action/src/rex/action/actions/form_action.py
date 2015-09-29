"""

    rex.action.actions.form_action
    ==============================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import StrVal, AnyVal, MapVal
from rex.db import Query
from rex.widget import formfield, dataspec
from rex.widget import Field, QueryURL, PortURL, responder

from ..validate import SyntaxVal
from .entity_action import EntityAction

__all__ = ('FormAction',)


class FormAction(EntityAction):
    """ Base class for actions which represent an entity form."""

    dataspec_factory = dataspec.EntitySpec

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

    def __init__(self, **values):
        super(FormAction, self).__init__(**values)
        # XXX: This is hack to ensure we are b/c with actions which are
        #      subclasses of Edit, Make and so on. Remove it when we fix those
        #      usage sites.
        if 'use_query' not in self.values:
            self.values['use_query'] = self.query is not None

    @cached_property
    def _complete_fields(self):
        fields = create_fieldset_from_value(self.value).fields
        fields = formfield.enrich(fields, self.entity.type.name, db=self.db)
        fields = fields + self.fields
        return fields

    @responder(
        wrap=lambda self, url: dataspec.EntitySpec(url, self.bind_port()),
        url_type=QueryURL)
    def data_query(self, req):
        query = Query(self.query, self.db)
        query.parameters = {f.value_key[0]: None for f in self._complete_fields}
        return query(req)

    def create_port(self):
        return super(FormAction, self).create_port(fields=self._complete_fields)


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

