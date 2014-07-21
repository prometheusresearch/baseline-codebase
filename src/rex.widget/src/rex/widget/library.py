#
# Copyright (c) 2014, Prometheus Research, LLC
#

import json
import cgi
from webob import Response
from rex.core import SeqVal, StrVal, UStrVal, IntVal, Error
from rex.web import url_for, route
from .widget import Widget, NullWidget
from .state import CollectionReferenceVal, StateVal, State
from .parse import WidgetVal


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


class TableWidget(Widget):

    name = 'Table'
    js_type = 'rex-widget/lib/Table'
    fields = [
        ('id', StrVal),
        ('data', CollectionReferenceVal),
        ('columns', SeqVal),
    ]


class TwoColumnLayoutWidget(Widget):

    name = 'TwoColumnLayout'
    js_type = 'rex-widget/lib/TwoColumnLayout'

    fields = [
            ('sidebar', WidgetVal, NullWidget()),
            ('main', WidgetVal, NullWidget()),
            ('sidebar_width', IntVal, 3),
    ]


class Select(Widget):

    name = 'Select'
    js_type = 'rex-widget/lib/Select'

    fields = [
        ('id', StrVal),
        ('data', CollectionReferenceVal, None),
        ('selected', StateVal(IntVal), State(None)),
    ]

    def as_json(self, req):
        return super(Select, self).as_json(req)
