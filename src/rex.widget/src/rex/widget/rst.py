"""

    rex.widget.rst
    ==============

    :copyright: 2015, Prometheus Research, LLC

"""

import re

import docutils.core
import docutils.writers.html4css1

from rex.core import Validate, StrVal
from rex.web import url_for

from .transitionable import TransitionableRecord

__all__ = ('RSTVal',)


class RST(TransitionableRecord):

    fields = ('src', 'links')

    _find_links = re.compile(r'__\$(\d+)__')

    def __transit_format__(self, req):
        return self._find_links.sub(lambda m: url_for(req, self.links[m.group()]), self.src)


class _HTMLTranslator(docutils.writers.html4css1.HTMLTranslator):

    def __init__(self, document):
        docutils.writers.html4css1.HTMLTranslator.__init__(self, document)
        self.links = {}

    def _generate_link_id(self):
        return '__$%d__' % len(self.links)

    def visit_reference(self, node):
        link_id = self._generate_link_id()
        self.links[link_id] = node['refuri']
        node['refuri'] = link_id
        return docutils.writers.html4css1.HTMLTranslator.visit_reference(self, node)


class RSTVal(Validate):
    """ Validator for strings which contain ReStructuredText markup.

    Example::

        class Text(Widget):

            name = 'Text'

            text = Field(
                RSTVal(),
                doc='Text (ReStructuredText markup allowed)')

    Then in URL Mapping::

        !<Text>
        text: |
            Title
            =====

            This is a link to applet_.

            .. _applet: somepackage:/path

    Links which point to Python packages are resolved against current WSGI
    request.
    """

    _validate = StrVal()

    def __call__(self, value):
        if isinstance(value, RST):
            return value
        value = self._validate(value)
        _writer = docutils.writers.html4css1.Writer()
        _writer.translator_class = _HTMLTranslator
        parts = docutils.core.publish_parts(value, writer=_writer)
        src = (parts['html_title'] + parts['body']).strip()
        return RST(src=src, links=_writer.visitor.links)
