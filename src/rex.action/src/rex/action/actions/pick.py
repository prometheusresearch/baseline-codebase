"""

    rex.action.actions.pick
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

import re
from cached_property import cached_property
from collections import OrderedDict

from rex.core import StrVal, OneOfVal, SeqVal, BoolVal, MaybeVal, OMapVal, BoolVal, RecordVal
from rex.port import Port
from rex.widget import Field, ColumnVal, FormFieldVal, responder, PortURL, undefined
from rex.widget import dataspec, formfield

from ..action import Action
from ..validate import RexDBVal
from ..dataspec import ContextBinding
from ..typing import RowTypeVal, RecordTypeVal, RecordType, annotate_port

__all__ = ('Pick',)


class Pick(Action):
    """ Show a list of records in database.

    This is a generic action which displays a list of records in database as a
    configurable datatable. Each item in the list can be selected by clicking on
    it.

    Example action declaration (``action.yaml``)::

        - type: pick
          id: pick-individual
          entity: individual

    """

    name = 'pick'
    js_type = 'rex-action/lib/Actions/Pick'


    entity = Field(
        RowTypeVal(),
        doc="""
        Name of a table in database.
        """)

    db = Field(
        RexDBVal(), default=None,
        transitionable=False,
        doc="""
        Database to use.
        """)

    columns = Field(
        MaybeVal(SeqVal(ColumnVal())), default=None,
        transitionable=False,
        deprecated='Use "fields" instead')

    fields = Field(
        MaybeVal(SeqVal(ColumnVal())), default=None,
        doc="""
        A set of fields to be shown as columns.

        If it's not provided then it will be inferred from database schema.
        """)

    search = Field(
        StrVal(), default=None,
        doc="""
        HTSQL expression which is used to search for a term.
        """)

    mask = Field(
        StrVal(), default=None,
        doc="""
        HTSQL expression which is used to filter out records.

        It can reference context variables declared in the ``input`` field.
        """)

    sort = Field(
        RecordVal(('field', StrVal()), ('asc', BoolVal(), True)), default=undefined,
        doc="""
        Column for sorting
        """)

    input = Field(
        RecordTypeVal(), default=RecordType.empty(),
        doc="""
        Context requirements.

        It specifies a set of keys and their types which should be present in
        context for an action to be available.

        For example::

            - id: pick-individual
              type: ...
              input:
              - mother: individual
              - father: individual

        Specifies that action ``pick-individual`` is only available when context
        has keys ``mother`` and ``father`` of type ``individual``.
        """)


    def __init__(self, **values):
        super(Pick, self).__init__(**values)
        if self.fields is None and self.columns is not None:
            self.values['fields'] = self.columns
        if self.fields is None:
            self.values['fields'] = formfield.from_port(self.port)
        else:
            self.values['fields'] = formfield.enrich(self.fields, self.port)

    @cached_property
    def port(self):
        filters = []

        if self.search:
            filters.append('__search__($search) := %s' % self.search)

        if self.mask:
            mask_args = ', '.join('$%s' % k for k in self.input.rows.keys())
            filters.append('__mask__(%s) := %s' % (mask_args or '$_', self.mask))

        if self.entity.type.state:
            filters.append('__state__($_) := %s' % self.entity.type.state.expression)

        if self.fields is None:
            grow_val = {
                'entity': self.entity.type.name,
                'filters': filters,
            }
            port = Port(grow_val, db=self.db)
        else:
            port = formfield.to_port(
                self.entity.type.name,
                self.fields,
                filters=filters,
                db=self.db)

        return annotate_port(self.domain, port)

    def _construct_data_spec(self, port_url):
        bindings = {}
        if self.search:
            bindings['*:__search__'] = dataspec.StateBinding('search')
        if self.mask:
            bindings['*:__mask__'] = ContextBinding(self.input.rows.keys(), is_join=False)
        if self.entity.type.state:
            bindings['*:__state__'] = '_'
        if self.sort:
            bindings['*.%s:sort' % self.sort.field] = 'asc' if self.sort.asc else 'desc'
        return dataspec.CollectionSpec(port_url, bindings)

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        return self.input, RecordType([self.entity])
