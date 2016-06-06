
from .wizard import get_schema
from rex.action import Action, typing
from rex.widget import computed_field


class PickTableWizard(Action):

    name = 'pick-table-wizard'
    js_type = 'rex-dbgui/lib/PickTableWizard'

    def context(self):
        return (self.domain.record(),
                self.domain.record(table=typing.ValueType('text')))

    @computed_field
    def tables(self, req):
        ret = []
        for table in get_schema().tables():
            ret.append({'id': table.label, 'title': table.label})
        return ret


class ViewTableWizard(Action):

    name = 'view-table-wizard'
    js_type = 'rex-dbgui/lib/ViewTableWizard'

    def context(self):
        return (self.domain.record(table=typing.ValueType('text')),
                self.domain.record())
