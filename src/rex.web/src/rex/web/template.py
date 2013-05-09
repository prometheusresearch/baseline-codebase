#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import get_packages
from .handler import FileHandler
from webob import Response
import os.path
import mimetypes
import json
import urllib
import jinja2


class TemplateHandler(FileHandler):

    def __call__(self, req):
        return render_to_response(self.filename, req)


class HTMLHandler(TemplateHandler):

    ext = '.html'


class RexJinjaEnvironment(jinja2.Environment):

    def join_path(self, template, parent):
        if ':' not in template:
            if template.startswith('/'):
                if ':' in parent:
                    package, path = parent.split(':', 1)
                    template = "%s:%s" % (package, template)
            else:
                if ':' in parent:
                    package, parent_path = parent.split(':', 1)
                else:
                    package = None
                    parent_path = parent
                parent_path = os.path.basename(parent_path)
                template = os.path.join(parent_path, template)
                if package is not None:
                    template = "%s:%s" % (package, template)
        return template


class RexJinjaLoader(jinja2.BaseLoader):

    def get_source(self, environment, template):
        packages = get_packages()
        if not packages.exists(template):
            raise jinja2.TemplateNotFound(template)
        path = packages.abspath(template)
        mtime = os.path.getmtime(path)
        stream = open(path)
        source = stream.read().decode('utf-8')
        stream.close()
        uptodate = (lambda path=path, mtime=mtime:
                        os.path.getmtime(path) == mtime)
        return (source, path, uptodate)


rex_jinja = RexJinjaEnvironment(
        extensions=['jinja2.ext.do', 'jinja2.ext.loopcontrols'],
        loader=RexJinjaLoader(),
)
rex_jinja.filters.update({
        'json': json.dumps,
        'urlencode': urllib.quote,
})
rex_jinja.globals.update({
        'len': len,
        'str': unicode,
})


def render_to_response(filename, req, **arguments):
    template = rex_jinja.get_template(filename)
    body = template.render(MOUNT=req.mount,
                           PARAMS=req.params,
                           **arguments)
    content_type = mimetypes.guess_type(filename)[0]
    if content_type is None:
        content_type = 'application/octet-stream'
    return Response(body=body, content_type=content_type, charset='utf-8')


