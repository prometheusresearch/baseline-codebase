"""

    rex.workflow.actions.make
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import MaybeVal, SeqVal, StrVal, MapVal
from rex.port import Port
from rex.widget import Field, FormFieldVal, responder, PortURL
from rex.widget import formfield, dataspec

from ..action import Action

__all__ = ('Make',)


class Make(Action):
    """ Make an entity."""

    name = 'make'
    js_type = 'rex-workflow/lib/Actions/Make'

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
        super(Make, self).__init__(**values)
        if self.fields is None:
            self.values['fields'] = formfield.from_port(self.port)
        else:
            self.values['fields'] = formfield.enrich(self.fields, self.port)

    @cached_property
    def port(self):
        if self.fields is None:
            return Port(self.entity)
        else:
            return formfield.to_port(self.entity, self.fields)

    def _construct_data_spec(self, port_url):
        return dataspec.EntitySpec(port_url, {})

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        input, output = super(Make, self).context()
        if not input:
            input = {v[1:]: v[1:] for v in self.value.values() if v.startswith('$')}
        if not output:
            output = {self.entity: self.entity}
        return input, output

