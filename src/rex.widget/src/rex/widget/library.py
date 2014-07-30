"""

    rex.widget.library
    ==================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import (
        SeqVal, StrVal, UStrVal, IntVal, BoolVal, Error, RecordVal, RecordField,
        cached)
from .widget import Widget, Field, NullWidget, iterate_widget
from .state import (
        state, dep, unknown, Reset,
        CollectionVal, PaginatedCollectionVal,
        StateVal, State, InRangeValue)
from .jsval import JSVal
from .parse import WidgetVal


class LabelWidget(Widget):

    name = 'Label'
    js_type = 'rex-widget/lib/Label'

    text = Field(UStrVal)


class HeaderWidget(Widget):

    name = 'Header'
    js_type = 'rex-widget/lib/Header'

    text = Field(UStrVal)


class SectionWidget(Widget):

    name = 'Section'
    js_type = 'rex-widget/lib/Section'
    content = Field(WidgetVal, default=NullWidget())


class LinkWidget(Widget):

    name = 'Link'
    js_type = 'rex-widget/lib/Link'

    url     = Field(StrVal)
    text    = Field(UStrVal, default=None)


class Panel(Widget):

    name = 'Panel'
    js_type = 'rex-widget/lib/Panel'

    title           = Field(StrVal)
    children        = Field(WidgetVal, default=NullWidget())
    header_toolbar  = Field(WidgetVal, default=NullWidget())
    footer_toolbar  = Field(WidgetVal, default=NullWidget())


class List(Widget):

    name = 'List'
    js_type = 'rex-widget/lib/List'

    id              = Field(StrVal)
    data            = Field(CollectionVal)
    selectable      = Field(BoolVal)
    selected        = Field(StateVal(IntVal, default=None))
    item_renderer   = Field(JSVal, default=None)


class TableWidget(Widget):

    name = 'Table'
    js_type = 'rex-widget/lib/Table'

    id          = Field(StrVal)
    data        = Field(CollectionVal)
    columns     = Field(SeqVal)
    selectable  = Field(BoolVal, default=False)
    selected    = Field(StateVal(StrVal, default=None))
    


class TwoColumnLayoutWidget(Widget):

    name = 'TwoColumnLayout'
    js_type = 'rex-widget/lib/TwoColumnLayout'

    sidebar         = Field(WidgetVal, default=NullWidget())
    main            = Field(WidgetVal, default=NullWidget())
    sidebar_width   = Field(IntVal, default=3)


class SelectWidget(Widget):

    name = 'Select'
    js_type = 'rex-widget/lib/Select'

    id      = Field(StrVal)
    data    = Field(CollectionVal, None)
    value   = Field(StateVal(IntVal,
                computator=InRangeValue(None, source='data'),
                dependencies=['data'], default=None))


class TextInputWidget(Widget):

    name = 'TextInput'
    js_type = 'rex-widget/lib/TextInput'

    id      = Field(StrVal)
    value   = Field(StateVal(StrVal, default=None))


class FilterWidget(Widget):

    name = 'Filter'
    js_type = 'rex-widget/lib/Filter'

    title   = Field(StrVal)
    filter  = Field(WidgetVal)


class FiltersWidget(Widget):

    name = 'Filters'
    js_type = 'rex-widget/lib/Filters'

    id                  = Field(StrVal)
    title               = Field(StrVal, default='Filters')
    filters             = Field(WidgetVal, default=NullWidget())
    show_apply_button   = Field(BoolVal, default=True)
    show_clear_button   = Field(BoolVal, default=True)

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

    def computator(self, state, graph, dirty=None):
        if state.value is unknown or (set(self.refs.values()) & dirty):
            return Reset({k: graph[dep] for k, dep in self.refs.items()})

        return state.value


class GridWidget(Widget):

    name = 'Grid'
    js_type = 'rex-widget/lib/Grid'

    id          = Field(StrVal)
    data        = Field(PaginatedCollectionVal(include_meta=True))
    selectable  = Field(BoolVal, False)
    selected    = Field(StateVal(IntVal, default=None))


class BarChart(Widget):

    name = 'BarChart'
    js_type = 'rex-widget/lib/BarChart'

    id      = Field(StrVal)
    data    = Field(CollectionVal(include_meta=True))
