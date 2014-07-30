"""

    rex.widget.library
    ==================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import SeqVal, StrVal, UStrVal, IntVal, BoolVal, Error, RecordVal
from .widget import Widget, Field, StateField, state, NullWidget, iterate_widget
from .state import dep, unknown, Reset, CollectionVal, PaginatedCollectionVal
from .parse import WidgetVal
from .jsval import JSVal


class LabelWidget(Widget):

    name    = 'Label'
    js_type = 'rex-widget/lib/Label'

    text = Field(UStrVal)


class HeaderWidget(Widget):

    name    = 'Header'
    js_type = 'rex-widget/lib/Header'

    text = Field(UStrVal)


class SectionWidget(Widget):

    name    = 'Section'
    js_type = 'rex-widget/lib/Section'

    content = Field(WidgetVal, default=NullWidget())


class LinkWidget(Widget):

    name    = 'Link'
    js_type = 'rex-widget/lib/Link'

    url     = Field(StrVal)
    text    = Field(UStrVal, default=None)


class Panel(Widget):

    name    = 'Panel'
    js_type = 'rex-widget/lib/Panel'

    title           = Field(StrVal)
    children        = Field(WidgetVal, default=NullWidget())
    header_toolbar  = Field(WidgetVal, default=NullWidget())
    footer_toolbar  = Field(WidgetVal, default=NullWidget())


class List(Widget):

    name    = 'List'
    js_type = 'rex-widget/lib/List'

    id              = Field(StrVal)
    data            = Field(CollectionVal)
    selectable      = Field(BoolVal)
    selected        = StateField(IntVal, default=None)
    item_renderer   = Field(JSVal, default=None)


class TableWidget(Widget):

    name    = 'Table'
    js_type = 'rex-widget/lib/Table'

    id          = Field(StrVal)
    data        = Field(CollectionVal)
    columns     = Field(SeqVal)
    selectable  = Field(BoolVal, default=False)
    selected    = StateField(StrVal, default=None)



class TwoColumnLayoutWidget(Widget):

    name    = 'TwoColumnLayout'
    js_type = 'rex-widget/lib/TwoColumnLayout'

    sidebar         = Field(WidgetVal, default=NullWidget())
    main            = Field(WidgetVal, default=NullWidget())
    sidebar_width   = Field(IntVal, default=3)


class SelectWidget(Widget):

    name    = 'Select'
    js_type = 'rex-widget/lib/Select'

    id      = Field(StrVal)
    data    = Field(CollectionVal, None)

    @state(IntVal, dependencies=['data'], default=None)
    def value(self, state, graph, dirty=None):
        if state.value is unknown:
            return Reset(None)

        data = '%s.data' % self.id

        # if data is marked as dirty we need to check if current value is
        # still valid and reset it otherwise
        if state.value is not None and data in dirty:
            options = [option['id'] for option in graph[data]["data"]]
            if state.value not in options:
                return Reset(None)

        return state.value


class TextInputWidget(Widget):

    name    = 'TextInput'
    js_type = 'rex-widget/lib/TextInput'

    id      = Field(StrVal)
    value   = StateField(StrVal, default=None)


class FilterWidget(Widget):

    name    = 'Filter'
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

    @state(IntVal, default=None)
    def value(self, state, graph, dirty=None):
        if state.value is unknown or (set(self.refs.values()) & dirty):
            return Reset({k: graph[dep] for k, dep in self.refs.items()})

        return state.value

    @value.set_dependencies
    def value_dependencies(self):
        return [dep(id, reset_only=True) for id in self.refs.values()]


class GridWidget(Widget):

    name    = 'Grid'
    js_type = 'rex-widget/lib/Grid'

    id          = Field(StrVal)
    data        = Field(PaginatedCollectionVal(include_meta=True))
    selectable  = Field(BoolVal, False)
    selected    = StateField(IntVal, default=None)


class BarChart(Widget):

    name    = 'BarChart'
    js_type = 'rex-widget/lib/BarChart'

    id      = Field(StrVal)
    data    = Field(CollectionVal(include_meta=True))
