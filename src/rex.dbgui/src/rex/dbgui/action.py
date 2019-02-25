
from .wizard import get_schema, table_wizard
from rex.core import BoolVal, SeqVal, StrVal
from rex.action import Action, typing
from rex.widget import Field, computed_field, responder, RequestURL
import yaml
from webob import Response


class PickTable(Action):
    """
    Internal action of the DBGUI. Do not use directly.
    """

    name = 'dbgui'
    js_type = 'rex-dbgui', 'PickTable'
    skip_tables = Field(SeqVal(StrVal))

    def context(self):
        return (self.domain.record(),
                self.domain.record(table=typing.ValueType('text')))

    @computed_field
    def tables(self, req):
        ret = []
        schema = get_schema()
        for table in schema.tables():
            if table.label not in self.skip_tables:
                ret.append({'id': table.label, 'title': table.label})
        return ret


class ViewSource(Action):
    """
    Internal action of the DBGUI. Do not use directly.
    """

    name = 'view-source'
    js_type = 'rex-dbgui', 'ViewSource'
    skip_tables = Field(SeqVal(StrVal))
    read_only = Field(BoolVal())

    def context(self):
        return (self.domain.record(table=typing.ValueType('text')),
                self.domain.record())

    @responder(url_type=RequestURL)
    def dump(self, req):
        table = req.GET.get('table')
        ret = {}
        if table:
            ret['dump'] = yaml.safe_dump(
                    table_wizard(table, self.skip_tables, self.read_only),
                    indent=2,
                    default_flow_style=False)
        return Response(json=ret)
