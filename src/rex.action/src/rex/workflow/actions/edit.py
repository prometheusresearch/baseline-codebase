"""

    rex.workflow.actions.edit
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import MaybeVal, SeqVal, StrVal, MapVal
from rex.port import Port
from rex.widget import Field, FormFieldVal, responder, PortURL
from rex.widget import formfield, dataspec

from ..action import Action

__all__ = ('Edit',)


class Edit(Action):
    """ Edit an entity."""

    name = 'edit'
    js_type = 'rex-workflow/lib/Actions/Edit'

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

    value = Field(
        MapVal(StrVal(), StrVal()), default={},
        doc="""
        An initial value.
        """)

    def __init__(self, **values):
        super(Edit, self).__init__(**values)
        if self.fields is None:
            fieldset = formfield.from_port(self.port)
            self.values['fields'] = fieldset.fields

    @cached_property
    def port(self):
        if self.fields is None:
            return Port(self.entity)
        else:
            return formfield.to_port(self.entity, self.fields)

    def _construct_data_spec(self, port_url):
        params = {'*': dataspec.PropBinding('context.%s' % self.entity)}
        return dataspec.EntitySpec(port_url, params)

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        input, output = super(Edit, self).context()
        if not input:
            input = {self.entity: self.entity}
        if not output:
            output = {self.entity: self.entity}
        return input, output


