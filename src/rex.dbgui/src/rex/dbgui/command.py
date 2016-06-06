

from rex.web import HandleLocation
from webob import Response
from webob.exc import HTTPNotFound
from rex.widget import render_widget

from .wizard import create_wizard, get_wizard

class HandleDBGUI(HandleLocation):

    path = '/**'

    def __call__(self, req):
        if req.path_info == '/':
            return self.render_root(req)
        else:
            return self.render_table(req)

    def render_root(self, req):
        wizard = create_wizard({
            'title': 'DBGUI',
            'path': [
                {'pick-table-wizard': [{'view-table-wizard': None}]}
            ],
            'actions': {
                'pick-table-wizard': {
                    'type': 'pick-table-wizard',
                    'title': 'Pick Table'
                },
                'view-table-wizard': {
                    'type': 'view-table-wizard',
                    'title': 'Table Wizard'
                },
            }
        })
        segment = req.path_info_peek()
        if segment == '@@':
            req.path_info_pop()
        return render_widget(wizard, req, path=req.path_info[1:])


    def render_table(self, req):
        table = req.path_info_pop()
        return get_wizard(table).render(req)

