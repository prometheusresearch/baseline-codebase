from rex.widget import Widget, Field, computed_field, responder, RequestURL, \
                       render_widget
from .wizard import table_wizard, root_wizard


class DBGUI(Widget):

    name = 'DBGUI'
    js_type = 'rex-dbgui/lib/DBGUI'

    @computed_field
    def root_wizard(self, req):
        return root_wizard().wizard

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
        return render_widget(table_wizard(table).wizard, copy, no_chrome=True,
                             path=path)
