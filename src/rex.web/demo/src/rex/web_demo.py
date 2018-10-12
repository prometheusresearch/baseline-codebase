
from rex.core import get_packages, StrVal, PIntVal
from rex.web import (HandleError, HandleLocation, HandleFile, Command, Parameter,
        render_to_response)
from webob import Response
import docutils.core


class HandleNotFound(HandleError):

    code = 404
    template = 'rex.web_demo:/templates/404.html'

    def __call__(self, req):
        return render_to_response(self.template, req, status=self.code,
                                  path=req.path)


class HandleRST(HandleFile):

    ext = '.rst'

    def __call__(self, req):
        # Load the file.
        packages = get_packages()
        with packages.open(self.path) as rst_file:
            rst_input = rst_file.read()

        # Render to HTML.
        html_output = docutils.core.publish_string(rst_input,
                                                   writer_name='html')

        # Generate the response.
        return Response(html_output)


class HandlePing(HandleLocation):

    path = '/ping'

    def __call__(self, req):
        return Response(content_type='text/plain', body="PONG!")


class HelloCmd(Command):

    path = '/hello'
    access = 'anybody'
    parameters = [
        Parameter('name', StrVal('[A-Za-z]+'), default='World'),
    ]

    def render(self, req, name):
        return Response("Hello, %s!" % name, content_type='text/plain')


class FactorialCmd(Command):

    path = '/factorial'
    access = 'anybody'
    parameters = [
            Parameter('n', PIntVal()),
    ]

    def render(self, req, n):
        f = 1
        for k in range(1, n+1):
            f *= k
        return Response(json={"n!": f})


class FibonacciCmd(Command):

    path = '/fibonacci/{n}'
    access = 'anybody'
    parameters = [
            Parameter('n', PIntVal()),
    ]

    def render(self, req, n):
        p = 0
        q = 1
        for k in range(n):
            p, q = q, p+q
        return Response(json={"fib": p})


class UnsafeCmd(Command):

    path = '/unsafe'
    access = 'anybody'
    unsafe = True

    def render(self, req):
        return Response("I trust you!", content_type='text/plain')


class ErrorCmd(Command):

    path = '/error'
    access = 'anybody'

    def render(self, req):
        raise RuntimeError("some unexpected problem occurred")


