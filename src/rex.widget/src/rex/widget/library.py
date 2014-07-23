#
# Copyright (c) 2014, Prometheus Research, LLC
#

from rex.core import (
        SeqVal, StrVal, UStrVal, IntVal, BoolVal, Error, RecordVal, RecordField)
from .widget import Widget, NullWidget, iterate_widget
from .state import (
    StateDescriptor,
    CollectionVal, PaginatedCollectionVal,
    StateVal, State)
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
        ('data', CollectionVal),
        ('columns', SeqVal),
        ('selectable', BoolVal, False),
        ('selected', State(StrVal), State(None)),
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
        ('data', CollectionVal, None),
        ('value', StateVal(IntVal), State(None)),
    ]


class TextInputWidget(Widget):

    name = 'TextInput'
    js_type = 'rex-widget/lib/TextInput'

    fields = [
        ('id', StrVal),
        ('value', StateVal(IntVal), State(None)),
    ]


class FilterWidget(Widget):

    name = 'Filter'
    js_type = 'rex-widget/lib/Filter'

    fields = [
        ('title', StrVal),
        ('filter', WidgetVal)
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

        value = {}

        for widget in iterate_widget(self.filters):
            fields = widget.filter.fields_mapping
            if 'id' in fields and isinstance(fields.get('value'), StateVal):
                filter_state_id = "%s.value" % widget.filter.id
                value[widget.filter.id] = descriptor.state[filter_state_id].value

        state_id = "%s.value" % self.id
        descriptor.state[state_id] = StateDescriptor(state_id, value, [], True)
        descriptor.widget["props"]["value"] = {"__state_read_write__": state_id}

        return descriptor


class GridWidget(Widget):

    name = 'Grid'
    js_type = 'rex-widget/lib/Grid'

    fields = [
        ('id', StrVal),
        ('data', PaginatedCollectionVal(include_meta=True)),
    ]


class BarChart(Widget):

    name = 'BarChart'
    js_type = 'rex-widget/lib/BarChart'

    fields = [
        ('id', StrVal),
        ('data', CollectionVal(include_meta=True)),
    ]
