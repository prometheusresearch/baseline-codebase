
from rex.core import Setting, StrVal, ChoiceVal, get_settings
from rex.web import Command, Parameter, authorize
from webob import Response
from webob.exc import HTTPUnauthorized

class HelloAccessSetting(Setting):
    """
    Permission to use the `/hello` command.
    """
    name = 'hello_access'
    validate = ChoiceVal('anybody', 'authenticated', 'nobody')

class HelloCmd(Command):

    path = '/hello'
    parameters = [
        Parameter('name', StrVal('[A-Za-z]+'), default='World'),
    ]

    def authorize(self, req):
        access = get_settings().hello_access
        if not authorize(req, access):
            raise HTTPUnauthorized()

    def render(self, req, name):
        return Response("Hello, %s!" % name, content_type='text/plain')

class ErrorCmd(Command):

    path = '/error'
    access = 'anybody'

    def render(self, req):
        raise RuntimeError("some unexpected problem occurred")

