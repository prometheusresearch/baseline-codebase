"""

    rex.widget.library
    ==================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import (
        SeqVal, StrVal, UStrVal, IntVal, BoolVal, Error, RecordVal, RecordField,
        cached)
from .widget import Widget, NullWidget, iterate_widget
from .state import (
        state, dep,
        CollectionVal, PaginatedCollectionVal,
        StateVal, State, InRangeValue)
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
        ('selected', StateVal(StrVal, default=None)),
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
        ('value', StateVal(IntVal,
            computator=InRangeValue(None, source='data'),
            dependencies=['data'], default=None)),
    ]


class TextInputWidget(Widget):

    name = 'TextInput'
    js_type = 'rex-widget/lib/TextInput'

    fields = [
        ('id', StrVal),
        ('value', StateVal(StrVal, default=None)),
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

    def __init__(self, *args, **kwargs):
        super(FiltersWidget, self).__init__(*args, **kwargs)
        self.refs = {
            w.filter.id: "%s.value" % w.filter.id
            for w in iterate_widget(self.filters)}
        self.dependencies = [
            dep(id, reset_only=True)
            for id in self.refs.values()]

    @cached
    def descriptor(self):
        descriptor = super(FiltersWidget, self).descriptor()

        state_id = "%s.value" % self.id

        props = dict(descriptor.ui.props)
        props["value"] = {"__state_read_write__": state_id}

        st = state(state_id, self.computator, dependencies=self.dependencies, rw=True)

        return descriptor._replace(
            ui=descriptor.ui._replace(props=props),
            state=descriptor.state.merge({state_id: st})
        )

    def initial_value(self, graph):
        return {k: graph.deref(dep) for k, dep in self.refs.items()}

    def computator(self, state, graph, dirty=None):
        if dirty is None:
            return self.initial_value(graph)

        if set(self.refs.values()) & dirty:
            return self.initial_value(graph)

        return state.value


class GridWidget(Widget):

    name = 'Grid'
    js_type = 'rex-widget/lib/Grid'

    fields = [
        ('id', StrVal),
        ('data', PaginatedCollectionVal(include_meta=True)),
        ('selectable', BoolVal, False),
        ('selected', StateVal(IntVal)),
    ]


class BarChart(Widget):

    name = 'BarChart'
    js_type = 'rex-widget/lib/BarChart'

    fields = [
        ('id', StrVal),
        ('data', CollectionVal(include_meta=True)),
    ]
