#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import StrVal, UStrVal, Error
from rex.web import url_for, route
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


class LinkWidget(Widget):

    name = 'Link'
    fields = [
            ('url', StrVal),
            ('text', UStrVal, None),
    ]

    def as_html(self, req):
        url = url_for(req, self.url).decode('utf-8')
        text = self.text or url
        return u"<a href=\"%s\">%s</a>\n" \
                % (cgi.escape(url, True), cgi.escape(text))


class GridWidget(Widget):

    name = 'Grid'
    fields = [
            ('path', StrVal),
    ]

    def as_html(self, req):
        handler = route(self.path)
        if handler is None or not hasattr(handler, 'port'):
            raise Error("Invalid path:", self.path)
        url = url_for(req, self.path)
        port = handler.port
        meta = port.describe().meta
        lines = []
        lines.append(u"<table id=\"grid\">\n")
        lines.append(u"<tr>\n")
        for field in meta.domain.fields[0].domain.item_domain.fields:
            lines.append(u"<th>%s</th>\n" % cgi.escape(field.header))
        lines.append(u"</tr>\n")
        lines.append(u"</table>\n")
        lines.append(u"<script type=\"text/javascript\">\n")
        lines.append(u"$(function () {\n");
        lines.append(u"$.ajaxSetup({ headers: { Accept: 'application/json' } });\n")
        lines.append(u"$.getJSON('%s', function (data) {\n" % url)
        lines.append(u"$.each(data['%s'], function (idx, row) {\n"
                     % meta.domain.fields[0].tag)
        lines.append(u"var $row = $('<tr/>').appendTo($('#grid tbody'));\n")
        for field in meta.domain.fields[0].domain.item_domain.fields:
            lines.append("$('<td/>').text(row['%s']).appendTo($row);\n"
                         % field.tag)
        lines.append(u"});\n")
        lines.append(u"});\n")
        lines.append(u"});\n")
        lines.append(u"</script>\n")
        return u"".join(lines)

