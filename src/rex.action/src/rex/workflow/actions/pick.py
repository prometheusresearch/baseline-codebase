"""

    rex.workflow.actions.pick
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

import re
from cached_property import cached_property

from rex.core import StrVal, OneOfVal, SeqVal, BoolVal, MaybeVal
from rex.port import Port
from rex.widget import Field, ColumnVal, FormFieldVal, formfield, responder, PortURL

from ..action import Action

__all__ = ('Pick',)


class Pick(Action):
    """ Show a list of records in database.

    This is a generic action which displays a list of records in database as a
    configurable datatable. Each item in the list can be selected by clicking on
    it, in that case the brief info is shown in service panel.
    """

    name = 'pick'
    js_type = 'rex-workflow/lib/Actions/Pick'


    entity = Field(
        StrVal(),
        doc="""
        Name of the table in database from which to show records in the list.
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
            fieldset = formfield.from_port(self.port)
            self.values['columns'] = fieldset.fields

    @cached_property
    def port(self):
        if self.columns is None:
            return Port(self.entity)
        else:
            return formfield.to_port(
                self.entity, self.columns,
                filters=self.filters,
                mask=self.mask)

    @responder(url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        input, output = super(Pick, self).context()
        if not output:
            output = {self.entity: self.entity}
        return input, output
