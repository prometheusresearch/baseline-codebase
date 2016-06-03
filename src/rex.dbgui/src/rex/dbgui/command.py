

from rex.web import HandleLocation
from webob import Response
from webob.exc import HTTPNotFound
from rex.widget import render_widget

from .wizard import get_wizard

class HandleDBGUI(HandleLocation):

    path = '/**'

    def __call__(self, req):
        if req.path_info == '/':
            return self.render_root(req)
        else:
            return self.render_table(req)

    def render_root(self, req):
        return Response(body='DBGUI root')

    def render_table(self, req):
        table = req.path_info_pop()
        return get_wizard(table).render(req)

