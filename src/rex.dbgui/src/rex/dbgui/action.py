
from .wizard import get_schema, table_wizard
from rex.action import Action, typing
from rex.widget import computed_field, responder, RequestURL
import yaml
from webob import Response


class PickTableWizard(Action):

    name = 'pick-table-wizard'
    js_type = 'rex-dbgui/lib/PickTableWizard'

    def context(self):
        return (self.domain.record(),
                self.domain.record(table=typing.ValueType('text')))

    @computed_field
    def tables(self, req):
        ret = []
        schema = get_schema()
        for table in schema.tables():
            ret.append({'id': table.label, 'title': table.label})
        return ret


class ViewTableWizard(Action):

    name = 'view-table-wizard'
    js_type = 'rex-dbgui/lib/ViewTableWizard'

    def context(self):
        return (self.domain.record(table=typing.ValueType('text')),
                self.domain.record())

    @responder(url_type=RequestURL)
    def dump(self, req):
        table = req.GET.get('table')
        ret = {}
        if table:
            ret['dump'] = yaml.safe_dump(table_wizard(table).dump,
                                         indent=2,
                                         default_flow_style=False)
        return Response(json=ret)


