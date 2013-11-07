
from rex.web import Authenticate, Command
from webob import Response

class AuthenticateDummy(Authenticate):

    def __call__(self, req):
        return req.remote_user or req.environ['rex.session'].get('user')

class LoginCmd(Command):

    path = '/login'
    access = 'anybody'

    def render(self, req):
        req.environ['rex.session'].setdefault('user', "dummy")
        return Response(status=302, location=req.application_url)

class LogoutCmd(Command):

    path = '/logout'
    access = 'anybody'

    def render(self, req):
        req.environ['rex.session'].pop('user', None)
        return Response(status=302, location=req.application_url)

