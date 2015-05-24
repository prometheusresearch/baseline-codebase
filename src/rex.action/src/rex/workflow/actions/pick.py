"""

    rex.workflow.actions.pick
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

import re
from cached_property import cached_property

from rex.core import StrVal, OneOfVal, SeqVal, BoolVal, MaybeVal
from rex.port import Port
from rex.widget import Field, ColumnVal, FormFieldVal, responder, PortURL
from rex.widget import dataspec, formfield

from ..action import Action
from ..validate import EntityDeclarationVal

__all__ = ('Pick',)


class Pick(Action):
    """ Show a list of records in database.

    This is a generic action which displays a list of records in database as a
    configurable datatable. Each item in the list can be selected by clicking on
    it.

    Example action declaration (``actions.yaml``)::

        - type: pick
          id: pick-individual
          entity: individual

    """

    name = 'pick'
    js_type = 'rex-workflow/lib/Actions/Pick'


    entity = Field(
        EntityDeclarationVal(),
        doc="""
        Name of a table in database.
        """)

    columns = Field(
        MaybeVal(SeqVal(ColumnVal())), default=None,
        doc="""
        A set of column specifications to be shown.

        If it's not provided then it will be inferred from database schema.
        """)

    filters = Field(
        SeqVal(StrVal()), default=[],
        doc="""
        Requirements.
        """)

    mask = Field(
        MaybeVal(StrVal()), default=None,
        doc="""
        Mask.
        """)

    def __init__(self, **values):
        super(Pick, self).__init__(**values)
        if self.columns is None:
            self.values['columns'] = formfield.from_port(self.port)
        else:
            self.values['columns'] = formfield.enrich(self.columns, self.port)

    @cached_property
    def port(self):
        if self.columns is None:
            return Port(self.entity.type)
        else:
            return formfield.to_port(
                self.entity.type, self.columns,
                filters=self.filters,
                mask=self.mask)

    def _construct_data_spec(self, port_url):
        # TODO: compile mask binding here
        return dataspec.CollectionSpec(port_url, {})

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        output = {self.entity.name: self.entity.type}
        return self.input, output
