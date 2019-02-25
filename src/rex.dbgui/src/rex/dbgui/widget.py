from rex.action import MountedActionVal
from rex.widget import Widget, Field, computed_field, responder, RequestURL, \
                       render_widget
from rex.core import BoolVal, SeqVal, StrVal
from .wizard import table_wizard, root_wizard


class DBGUI(Widget):

    name = 'DBGUI'
    js_type = 'rex-dbgui', 'DBGUI'
    skip_tables = Field(SeqVal(StrVal), default=[])
    read_only = Field(BoolVal(), default=False)

    mount = MountedActionVal()

    @computed_field
    def root_wizard(self, req):
        return self.mount(root_wizard(self.skip_tables).wizard)

    @responder(url_type=RequestURL)
    def table_wizard(self, req):
        name = '.tableWizard'
        pos = req.path_info.find(name)
        copy = req.copy()
        copy.script_name = copy.script_name + req.path_info[:pos + len(name)]
        copy.path_info = req.path_info[pos + len(name):]
        table = copy.path_info_peek()
        copy.path_info_pop()
        path = None
        if copy.path_info.startswith('/@@/'):
            path = copy.path_info[4:]
        return render_widget(
                self.mount(table_wizard(table, self.skip_tables, self.read_only).wizard),
                copy, no_chrome=True, path=path)
