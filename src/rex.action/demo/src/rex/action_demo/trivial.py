
from rex.action import Action
from rex.widget import Field, RSTVal, URLVal, computed_field, \
                       responder, RequestURL
from rex.core import get_packages
from rex.web import url_for
from webob import Response


class Trivial(Action):

    name = 'trivial'
    js_type = 'rex-action-demo', 'Trivial'

    description = Field(RSTVal())
    help_link = Field(URLVal(), default='rex.action_demo:/doc')

    def context(self):
        return (self.domain.record(), self.domain.record())

    @computed_field
    def site_root(self, req):
        return url_for(req, '%s:/' % get_packages()[0].name)

    @responder(url_type=RequestURL)
    def say_hello(self, req):
        name = req.GET.get('name', 'Anonymous')
        return Response(json={'greeting': ('Hello, %s!' % name)})
