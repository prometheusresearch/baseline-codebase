"""

    rex.workflow.actions.view
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import MaybeVal, SeqVal, StrVal
from rex.port import Port
from rex.widget import Field, FormFieldVal, responder, PortURL
from rex.widget import formfield, dataspec

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
            self.values['fields'] = formfield.from_port(self.port)
        else:
            self.values['fields'] = formfield.enrich(self.fields, self.port)

    @cached_property
    def port(self):
        entity_type = self.input[self.entity]
        if self.fields is None:
            return Port(self.entity)
        else:
            return formfield.to_port(entity_type, self.fields)

    def _construct_data_spec(self, port_url):
        params = {'*': dataspec.PropBinding('context.%s' % self.entity)}
        return dataspec.EntitySpec(port_url, params)

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        input, output = super(View, self).context()
        if not input:
            input = {self.entity: self.entity}
        return input, output
