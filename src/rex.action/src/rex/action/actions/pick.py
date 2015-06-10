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
from ..validate import EntityDeclarationVal, RexDBVal
from ..dataspec import ContextBinding

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
        EntityDeclarationVal(),
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
        doc="""
        A set of column specifications to be shown.

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
        OMapVal(StrVal(), StrVal()), default=OrderedDict(),
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
        if self.columns is None:
            self.values['columns'] = formfield.from_port(self.port)
        else:
            self.values['columns'] = formfield.enrich(self.columns, self.port)

    @cached_property
    def port(self):
        filters = []
        mask = None

        if self.search:
            filters.append('__search__($search) := %s' % self.search)

        if self.mask:
            if self.input:
                mask_args = ', '.join('$%s' % k for k in self.input.keys())
                filters.append('__mask__(%s) := %s' % (mask_args, self.mask))
            else:
                mask = self.mask

        if self.columns is None:
            grow_val = {
                'entity': self.entity.type,
                'filters': filters,
            }
            if mask:
                grow_val['mask'] = mask
            port = Port(grow_val, db=self.db)
        else:
            port = formfield.to_port(
                self.entity.type,
                self.columns,
                filters=filters,
                mask=mask,
                db=self.db)
        return port

    def _construct_data_spec(self, port_url):
        bindings = {}
        if self.search:
            bindings['*:__search__'] = dataspec.StateBinding('search')
        if self.mask and self.input:
            bindings['*:__mask__'] = ContextBinding(self.input.keys(), is_join=False)
        if self.sort:
            bindings['*.%s:sort' % self.sort.field] = 'asc' if self.sort.asc else 'desc'
        return dataspec.CollectionSpec(port_url, bindings)

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        output = {self.entity.name: self.entity.type}
        return dict(self.input), output
