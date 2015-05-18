"""

    rex.workflow.actions.view
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import MaybeVal, SeqVal, StrVal
from rex.port import Port
from rex.widget import Field, FormFieldVal, responder, PortURL
from rex.widget import formfield

from ..action import Action

__all__ = ('View',)


class View(Action):
    """ View information about specified entity."""

    name = 'view'
    js_type = 'rex-workflow/lib/Actions/View'

    entity = Field(
        StrVal(),
        doc="""
        """)

    fields = Field(
        MaybeVal(SeqVal(FormFieldVal())), default=None,
        doc="""
        A list of fields to show. If not specified then it will be generated
        automatically based on the data schema.
        """)

    def __init__(self, **values):
        super(View, self).__init__(**values)
        if self.fields is None:
            fieldset = formfield.from_port(self.port)
            self.values['fields'] = fieldset.fields

    @cached_property
    def port(self):
        if self.fields is None:
            return Port(self.entity)
        else:
            return formfield.to_port(self.entity, self.fields)

    @responder(url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        inputs = {self.entity: self.entity}
        outputs = {}
        return inputs, outputs
