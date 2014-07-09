#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import UStrVal
from .widget import Widget, NullWidget
from .parse import WidgetVal
import cgi


class LabelWidget(Widget):

    name = 'Label'
    fields = [
            ('text', UStrVal),
    ]

    def as_html(self, req):
        return u"%s\n" % cgi.escape(self.text)


class HeaderWidget(Widget):

    name = 'Header'
    fields = [
            ('text', UStrVal),
    ]

    def as_html(self, req):
        return u"<h1>%s</h1>\n" % cgi.escape(self.text)


class SectionWidget(Widget):

    name = 'Section'
    fields = [
            ('content', WidgetVal, NullWidget())
    ]

    def as_html(self, req):
        return u"<div>\n%s</div>\n" % self.content.as_html(req)


class PanelWidget(Widget):

    name = 'Panel'
    fields = [
            ('left', WidgetVal, NullWidget()),
            ('right', WidgetVal, NullWidget()),
    ]

    def as_html(self, req):
        return u"<div class=\"row\">\n<div class=\"col-md-6\">\n%s</div>\n" \
                u"<div class=\"col-md-6\">\n%s</div>\n</div>\n" \
                % (self.left.as_html(req), self.right.as_html(req))


