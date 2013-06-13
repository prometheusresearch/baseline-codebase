
from rex.core import StrVal
from rex.web import Command, Parameter
from webob import Response

class HelloCmd(Command):

    path = '/hello'
    role = 'anybody'
    parameters = [
        Parameter('name', StrVal('[A-Za-z]+'), default='World'),
    ]

    def render(self, req, name):
        return Response("Hello, %s!" % name, content_type='text/plain')

class ErrorCmd(Command):

    path = '/error'
    role = 'anybody'

    def render(self, req):
        raise RuntimeError("some unexpected problem occurred")

