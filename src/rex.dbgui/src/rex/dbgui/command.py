

from rex.web import HandleLocation
from webob import Response
from webob.exc import HTTPNotFound
from rex.widget import render_widget

from .wizard import root_wizard, table_wizard

class HandleDBGUI(HandleLocation):

    path = '/**'

    def __call__(self, req):
        if req.path_info == '/' or req.path_info.startswith('/@@'):
            return root_wizard().render(req)
        else:
            table = req.path_info_pop()
            return table_wizard(table).render(req)

