"""

    rex.widget.library
    ==================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import (
        AnyVal, OneOfVal, SeqVal, StrVal, UStrVal, IntVal, BoolVal, MaybeVal,
        RecordVal)
from .widget import (
        Widget, GroupWidget, NullWidget, Field, StateField, state,
        iterate_widget)
from .state import unknown, State, Reset, Dep, CollectionVal, PaginatedCollectionVal
from .parse import WidgetVal
from .jsval import JSVal


class Container(Widget):

    name        = 'Container'
    js_type     = 'rex-widget/lib/Container'

    rows        = Field(WidgetVal, default=NullWidget())


class Row(Widget):

    name        = 'Row'
    js_type     = 'rex-widget/lib/Row'

    columns     = Field(WidgetVal, default=NullWidget())
    height      = Field(IntVal, default=NullWidget())


class Column(Widget):

    name        = 'Column'
    js_type     = 'rex-widget/lib/Column'

    children    = Field(WidgetVal, default=NullWidget())
    width       = Field(IntVal, default=NullWidget())


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


class Tabs(Widget):

    name    = 'Tabs'
    js_type = 'rex-widget/lib/Tabs'

    id      = Field(StrVal)
    active  = StateField(IntVal, default=1)
    tabs    = Field(WidgetVal, default=NullWidget())

    @property
    def active_state(self):
        return '%s/active' % self.id

    def is_tab_active(self, n, is_active):
        def _is_tab_active(graph):
            if is_active and not is_active(graph):
                return False
            active = graph[self.active_state]
            return active == n
        return _is_tab_active

    def on_tab(self, props, state, n, tab):
        descriptor = tab.descriptor()
        descriptor_state = {
            id: desc._replace(
                is_active=self.is_tab_active(n, desc.is_active),
                dependencies=desc.dependencies + [Dep(self.active_state)]
            ) for id, desc in descriptor.state.items()
        }
        state.update(descriptor_state)

    def on_widget(self, props, state, name, widget):
        props[name] = widget.descriptor().ui
        if isinstance(widget, GroupWidget):
            for n, tab in enumerate(widget.children):
                self.on_tab(props, state, n + 1, tab)
        else:
            self.on_tab(props, state, 1, widget)


class Tab(Widget):

    name    = 'Tab'
    js_type = 'rex-widget/lib/Tab'

    title   = Field(StrVal)
    content = Field(WidgetVal, default=NullWidget())


class RadioButtonGroup(Widget):

    name    = 'RadioButtonGroup'
    js_type = 'rex-widget/lib/RadioButtonGroup'

    options = Field(SeqVal)
    layout  = Field(StrVal, default='vertical')


class CheckboxGroup(Widget):

    name    = 'CheckboxGroup'
    js_type = 'rex-widget/lib/CheckboxGroup'

    options = Field(SeqVal)
    layout  = Field(StrVal, default='vertical')


class List(Widget):

    name    = 'List'
    js_type = 'rex-widget/lib/List'

    id              = Field(StrVal)
    data            = Field(CollectionVal, default=None)
    items           = Field(SeqVal, default=None)
    selectable      = Field(BoolVal, default=False)
    selected        = StateField(OneOfVal(IntVal(), StrVal()), default=None)
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
    options = Field(SeqVal, default=None)
    data    = Field(CollectionVal, default=None)
    title_for_empty = Field(StrVal, default=None)

    @state(OneOfVal(StrVal()), default=None)
    def value(self, state, graph, dirty=None, is_active=True):
        if state.value is unknown:
            return Reset(None)

        data = '%s/data' % self.id

        # if data is marked as dirty we need to check if current value is
        # still valid and reset it otherwise
        if state.value is not None and data in dirty:
            options = [o['id'] for o in graph[data]['data']]
            if self.options is not None:
                options = [o['id'] for o in self.options]
            if state.value not in options:
                return Reset(None)

        return state.value

    @value.set_dependencies
    def value_dependencies(self):
        return ['data'] if self.data is not None else []


class TextInputWidget(Widget):

    name    = 'TextInput'
    js_type = 'rex-widget/lib/TextInput'

    id          = Field(StrVal)
    value       = StateField(StrVal, persistence=State.EPHEMERAL, default=None)
    placeholder = Field(StrVal, default='')

class CheckboxWidget(Widget):

    name    = 'Checkbox'
    js_type = 'rex-widget/lib/Checkbox'

    id      = Field(StrVal)
    value   = StateField(BoolVal, persistence=State.EPHEMERAL, default=None)

class FilterWidget(Widget):

    name    = 'Filter'
    js_type = 'rex-widget/lib/Filter'

    title   = Field(StrVal)
    filter  = Field(WidgetVal)


class FiltersWidget(Widget):

    name = 'Filters'
    js_type = 'rex-widget/lib/Filters'

    id                  = Field(StrVal)
    title               = Field(StrVal, default=None)
    filters             = Field(WidgetVal, default=NullWidget())
    inline              = Field(BoolVal, default=False)
    show_apply_button   = Field(BoolVal, default=True)
    show_clear_button   = Field(BoolVal, default=True)

    def __init__(self, *args, **kwargs):
        super(FiltersWidget, self).__init__(*args, **kwargs)
        self.refs = {
            w.filter.id: "%s/value" % w.filter.id
            for w in iterate_widget(self.filters)}

    @state(AnyVal)
    def value(self, state, graph, dirty=None, is_state=True, is_active=True):
        if state.value is unknown or (set(self.refs.values()) & dirty):
            return Reset({k: graph[dep] for k, dep in self.refs.items()})

        return state.value

    @value.set_dependencies
    def value_dependencies(self):
        return [Dep(id, reset_only=True) for id in self.refs.values()]

class GridWidget(Widget):
    """ Data Grid."""

    name    = 'Grid'
    js_type = 'rex-widget/lib/Grid'

    id                  = Field(StrVal)
    data                = Field(PaginatedCollectionVal(include_meta=True))
    selectable          = Field(BoolVal, False)
    selected            = StateField(AnyVal, default=None)
    search              = StateField(StrVal, default=None)
    columns             = Field(AnyVal, default={})
    resizeable_columns  = Field(BoolVal, default=False)
    sortable_columns    = Field(BoolVal, default=False)
    hide_columns        = Field(SeqVal(StrVal), default=[])
    show_columns        = Field(MaybeVal(SeqVal(StrVal)), default=None)


class BarChart(Widget):

    name    = 'BarChart'
    js_type = 'rex-widget/lib/BarChart'

    id      = Field(StrVal)
    data    = Field(CollectionVal(include_meta=True))

class ButtonWidget(Widget):

    name    = 'Button'
    js_type = 'rex-widget/lib/Button'

    id      = Field(StrVal)
    name   =  Field(StrVal, default='Save')
