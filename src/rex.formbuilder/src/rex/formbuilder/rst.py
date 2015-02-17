
from rex.core import Error, get_packages, IntVal, StrVal, ChoiceVal, BoolVal
from rex.widget import Widget, Field, StateField
from rex.widget.field.state import StateFieldBase
from rex.widget.field.url import URLField, URLVal

import os
import re
from rex.web import url_for
from docutils.core import publish_parts
from docutils.transforms import Transform
from docutils.writers import html4css1
from docutils.nodes import image as ImageNode

LOCATION_PATTERN='\A[\w._-]+[:][/].+\Z'

class _ImageLocationHandler(Transform):

    default_priority = 800
    request = None # should be set in subclass

    def apply (self):
        regex = re.compile(r'\A(?:%s)\Z' % LOCATION_PATTERN)
        for image in self.document.traverse(ImageNode):
            uri = image.get('uri')
            if uri and regex.match(image.get('uri')):
                image['uri'] = url_for(self.request, uri)


class RexWriter(html4css1.Writer):

    def __init__(self, request):
        # super(self.__class__, self).__init__()
        html4css1.Writer.__init__(self)
        self.request = request

    def get_transforms(self):
        tfs = html4css1.Writer.get_transforms(self)
        transform = type('ImageLocationHandler', \
            (_ImageLocationHandler, object), {'request': self.request})
        return tfs + [transform]


def render_rst(request, content):
    writer = RexWriter(request)
    return publish_parts(content, writer=writer)['html_body']


class StaticResourceVal(StrVal):
    """
    Accepts a valid location to a static resource in format:
      package:/path/to/file
    """

    pattern=LOCATION_PATTERN

    def __call__(self, data):
        data = super(StaticResourceVal, self).__call__(data)
        abspath = get_packages().abspath(data)
        if not os.path.exists(abspath):
            raise Error("Static resource doesn't exist: %s" % data)
        return data


class StaticResourceField(StateFieldBase):

    _validate = StaticResourceVal()

    def __init__(self, default=NotImplemented, doc=None, name=None,
                       process=None):
        super(StaticResourceField, self).__init__(
            self._validate, default=default, doc=doc, name=name)
        self.process = process

    def compute(self, value, widget, state, graph, request):
        packages = get_packages()
        try:
            with packages.open(value) as f:
                content = f.read()
        except IOError, e:
            raise Error("StaticResourceField: %s" % unicode(e))
        if self.process:
            content = self.process(request, content)
        return content


class RstPage(Widget):
    """ReST Formatted Page"""

    name = 'RstPage'
    js_type = 'rex-formbuilder/lib/RstPage'

    content = StaticResourceField(process=render_rst)
    preformatted = StateField(BoolVal(), default=False)

