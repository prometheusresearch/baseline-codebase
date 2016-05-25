

from rex.web import HandleLocation
from webob import Response
from webob.exc import HTTPNotFound
from rex.widget import render_widget

from .wizard import get_wizard

class HandleTable(HandleLocation):

    PREFIX = '/table/'
    path = '%s**' % PREFIX

    def __call__(self, req):
        req.path_info_pop()
        table = req.path_info_pop()
        wizard = get_wizard(table)
        if wizard is None:
            raise HTTPNotFound("table '%s' not found" % table)
        segment = req.path_info_peek()
        if segment == '@@':
            req.path_info_pop()
        print 'script name', req.script_name
        print 'Path', req.path_info
        return render_widget(wizard, req, path=req.path_info[1:])

