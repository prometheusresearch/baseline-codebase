"""

    rex.workflow.actions.view
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from htsql.core import domain as domains

from rex.core import SeqVal, MapVal, StrVal
from rex.widget.modern import Field, undefined

from ..base import ActionWidget
from ..port_field import PortField
from ..validate import FieldDescVal


class View(ActionWidget):
    """ View information about specified entity."""

    name = 'View'
    js_type = 'rex-workflow/lib/Actions/View'

    @property
    def default_activity_name(self):
        return 'View %s info' % self.data.entity

    @property
    def context_in(self):
        return [self.data.entity]

    @property
    def context_out(self):
        return []

    def assign_props(self, props):
        if props.fields is undefined:
            field = field_from_port(self.data.port)
            assert field.type == 'entity', 'Not implemented'
            props.fields = field.fields

    data = PortField()

    fields = Field(
        SeqVal(FieldDescVal()), default=undefined,
        doc="""
        A list of fields to show. If not specified then it will be generated
        automatically based on the data schema.
        """)

    fields_override = Field(
        MapVal(StrVal(), FieldDescVal()), default=undefined,
        doc="""
        An override config for specified fields. Useful when you want fields to
        be generated automatically but to override some generated values by
        hand.
        """)


def field_from_port(port):
    meta = port.describe().meta
    # { <entity tag>: [ <domain> ] }
    domain = meta.domain.fields[0].domain.item_domain
    return field_from_domain(domain)


_make_field_desc = FieldDescVal()


def field_from_domain(domain, key='__root__', name='Root'):
    if isinstance(domain, domains.RecordDomain):
        fields = [field_from_domain(f.domain, key=f.tag, name=f.header)
                  for f in domain.fields]
        return _make_field_desc({
            'type': 'entity',
            'key': key,
            'name': name,
            'fields': fields,
        })
    elif isinstance(domain, domains.ListDomain):
        fields = [field_from_domain(f.domain, key=f.tag, name=f.header)
                  for f in domain.item_fields]
        return _make_field_desc({
            'type': 'list',
            'key': key,
            'name': name,
            'item_fields': fields,
        })
    else:
        return _make_field_desc({
            'type': 'string',
            'key': key,
            'name': name,
        })
