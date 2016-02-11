
# dirty rex.web patch to prevent HTML files to be processed as Jinja templates
from rex.web.template import HandleHTML
from rex.core import Initialize, get_packages, Setting
from webob import Response

def return_html(self, req):
    package_name, path =  self.path.split(':', 1)
    content = get_packages()[package_name].open(path).read()
    return Response(body=content, content_type=self.content_type)

class DeactivateHTMLTemplate(Initialize):

    def __call__(self):
        HandleHTML.__call__ = return_html
