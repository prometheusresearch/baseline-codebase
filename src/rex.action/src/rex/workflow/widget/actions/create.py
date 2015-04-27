"""

    rex.workflow.actions.create
    ===========================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal, MapVal, SeqVal, OneOfVal
from rex.widget.modern import Field, undefined

from ..port_field import PortField
from ..utils import inflector
from ..validate import FieldDescVal, KeyPathVal
from ..base import ActionWidget
from .view import field_from_port

__all__ = ('Create',)


class Create(ActionWidget):

    type = 'create'
    name = 'Create'
    js_type = 'rex-workflow/lib/Actions/Create'

    icon = Field(StrVal(), default='plus')

    default_title = property(lambda s: 'Create %s' % \
                                       inflector.a(s.entity.entity))

    entity = PortField()

    value = Field(MapVal(StrVal(), StrVal()), default={})

    fields = Field(
        SeqVal(OneOfVal(KeyPathVal(), FieldDescVal())), default=undefined,
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

    def assign_props(self, props):
        entity_field = field_from_port(self.entity.port)
        assert entity_field.type == 'entity', 'Not implemented'
        if props.get('fields', undefined) is undefined:
            props.fields = entity_field.fields
        else:
            fields_by_keypath = {KeyPathVal.to_string(f.key): f
                                 for f in entity_field.fields}
            props.fields = [fields_by_keypath[KeyPathVal.to_string(f)] if isinstance(f, list) else f
                            for f in props.fields]
        if props.get('fields_override', undefined):
            props.fields = [props.fields_override.get(KeyPathVal.to_string(f.key), f) for f in props.fields]

    def context(self):
        inputs = [v[1:] for v in self.value.values() if v.startswith('$')]
        outputs = [self.entity.entity]
        return inputs, outputs
