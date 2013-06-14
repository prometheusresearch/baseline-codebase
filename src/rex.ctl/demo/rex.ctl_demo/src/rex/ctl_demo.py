
from rex.core import Setting, StrVal, ChoiceVal, get_settings
from rex.web import Command, Parameter, authorize
from webob import Response
from webob.exc import HTTPUnauthorized

class HelloRoleSetting(Setting):
    """
    Permission to use the `/hello` command.
    """
    name = 'hello_role'
    validate = ChoiceVal('anybody', 'authenticated', 'nobody')


class HelloCmd(Command):

    path = '/hello'
    parameters = [
        Parameter('name', StrVal('[A-Za-z]+'), default='World'),
    ]

    def authorize(self, req):
        role = get_settings().hello_role
        if not authorize(req, role):
            raise HTTPUnauthorized()

    def render(self, req, name):
        return Response("Hello, %s!" % name, content_type='text/plain')

class ErrorCmd(Command):

    path = '/error'
    role = 'anybody'

    def render(self, req):
        raise RuntimeError("some unexpected problem occurred")

