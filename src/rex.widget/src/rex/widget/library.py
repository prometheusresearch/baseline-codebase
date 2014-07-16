#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob import Response
from rex.core import StrVal, UStrVal, IntVal, Error
from rex.web import url_for, route
from .widget import Widget, NullWidget
from .parse import WidgetVal
import cgi


class LabelWidget(Widget):

    name = 'Label'
    js_type = 'rex-widget/lib/Label'
    fields = [
            ('text', UStrVal),
    ]


class HeaderWidget(Widget):

    name = 'Header'
    js_type = 'rex-widget/lib/Header'
    fields = [
            ('text', UStrVal),
    ]


class SectionWidget(Widget):

    name = 'Section'
    js_type = 'rex-widget/lib/Section'
    fields = [
            ('content', WidgetVal, NullWidget())
    ]


class LinkWidget(Widget):

    name = 'Link'
    js_type = 'rex-widget/lib/Link'
    fields = [
            ('url', StrVal),
            ('text', UStrVal, None),
    ]


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


class TwoColumnLayoutWidget(Widget):

    name = 'TwoColumnLayout'
    js_type = 'rex-widget/lib/TwoColumnLayout'

    fields = [
            ('sidebar', WidgetVal, NullWidget()),
            ('main', WidgetVal, NullWidget()),
            ('sidebar_width', IntVal, 3),
    ]
