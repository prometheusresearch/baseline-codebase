#
# Copyright (c) 2014, Prometheus Research, LLC
#

import json
import cgi
from webob import Response
from rex.core import SeqVal, StrVal, UStrVal, IntVal, BoolVal, Error
from rex.web import url_for, route
from .widget import Widget, NullWidget, iterate_widget
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


class SelectWidget(Widget):

    name = 'Select'
    js_type = 'rex-widget/lib/Select'

    fields = [
        ('id', StrVal),
        ('data', CollectionReferenceVal, None),
        ('value', StateVal(IntVal), State(None)),
    ]


class TextInputWidget(Widget):

    name = 'TextInput'
    js_type = 'rex-widget/lib/TextInput'

    fields = [
        ('id', StrVal),
        ('value', StateVal(IntVal), State(None)),
    ]


class FiltersWidget(Widget):

    name = 'Filters'
    js_type = 'rex-widget/lib/Filters'

    fields = [
        ('id', StrVal),
        ('title', StrVal, 'Filters'),
        ('filters', WidgetVal, NullWidget()),
        ('show_apply_button', BoolVal, True),
        ('show_clear_button', BoolVal, True),
    ]

    def descriptor(self, req):
        descriptor = super(FiltersWidget, self).descriptor(req)

        filter_state_ids  = []
        value = {}

        for widget in iterate_widget(self.filters):
            fields = widget.fields_mapping
            if 'id' in fields and isinstance(fields.get('value'), StateVal):
                filter_state_id = "%s.value" % widget.id
                filter_state_ids.append(filter_state_id)
                value[widget.id] = descriptor.state[filter_state_id].value

        state_id = "%s.value" % self.id
        descriptor.state.add(state_id, value)
        descriptor.widget["props"].update({
            "value": {"__state_read_write__": state_id},
            "filterStateIds": filter_state_ids
        })

        return descriptor
