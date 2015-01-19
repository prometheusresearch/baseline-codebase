"""

    rex.widget.library.base
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import Validate
from rex.core import (
    AnyVal, OneOfVal, SeqVal, StrVal, UStrVal, IntVal, BoolVal, MaybeVal,
    MapVal, ChoiceVal, RecordVal)

from ..descriptors import StateRead
from ..widget import Widget, NullWidget
from ..field import Field, IDField, StateField, CollectionField, PaginatedCollectionField, URLField
from ..undefined import undefined
from ..state import unknown, State, Reset, Dep
from ..validate import WidgetVal
from ..action import ActionVal


class Label(Widget):
    """ Label."""

    name = 'Label'
    js_type = 'rex-widget/lib/Label'

    text = Field(UStrVal)


class Header(Widget):
    """ Header."""

    name = 'Header'
    js_type = 'rex-widget/lib/Header'

    text = Field(
        UStrVal(),
        doc="Content")
    level = Field(
        IntVal(), default=1,
        doc="Level")


class Text(Widget):
    """ Text."""

    name = 'Text'
    js_type = 'rex-widget/lib/Text'

    text = Field(
        UStrVal,
        doc="Content")


class Button(Widget):

    name = 'Button'
    js_type = 'rex-widget/lib/Button'

    text = Field(
        StrVal(), default=undefined)

    icon = Field(
        StrVal(), default=undefined)

    icon_right = Field(
        StrVal(), default=undefined)

    success = Field(
        BoolVal(), default=undefined)

    danger = Field(
        BoolVal(), default=undefined)

    quiet = Field(
        BoolVal(), default=undefined)

    on_click = Field(
        ActionVal(), default=undefined)

    class_name = Field(
        StrVal(), default=undefined)


class UnsafeHTML(Widget):
    """ Widget which allows injecting raw HTML content into page.

    This can be used to embed YouTube/Vimeo videos for example::

        !<UnsafeHTML>
        html: |
            <iframe ...></iframe>

    .. danger::
        This can result in XSS injection.
    """

    name = 'UnsafeHTML'
    js_type = 'rex-widget/lib/UnsafeHTML'

    html = Field(UStrVal)


class Section(Widget):

    name = 'Section'
    js_type = 'rex-widget/lib/Section'

    class_name = Field(StrVal, default=undefined)
    content = Field(WidgetVal, default=NullWidget())


class Link(Widget):
    """ Navigation link"""

    name = 'Link'
    js_type = 'rex-widget/lib/Link'

    id = IDField()

    href = URLField(
        doc="Link URL")

    text = Field(
        UStrVal(), default=undefined,
        doc="Link text")

    params = Field(
        MapVal(StrVal(), StrVal()), default={},
        doc="Link parameters")

    unsafe = Field(
        BoolVal(), default=False,
        doc="Do not validate ``href`` and ``params`` fields")


class ValueKeyVal(Validate):

    underlying_validator = StrVal()

    def __call__(self, value):
        if isinstance(value, list):
            return value
        value = self.underlying_validator(value)
        if '.' in value:
            return value.split('.')
        else:
            return [value]


class Table(Widget):
    """ Table widget.
    """

    ON_DATA_UPDATE = 'on_data_update'

    column_type = RecordVal(
        ('key', ValueKeyVal()),
        ('title', StrVal())
    )

    name = 'Table'
    js_type = 'rex-widget/lib/Table'

    id = Field(
        StrVal(),
        doc="Widget identifier")

    data = CollectionField(
        doc="Table data")

    columns = Field(
        SeqVal(column_type),
        doc="Columns specification")

    selectable = Field(
        BoolVal(), default=False,
        doc="Make rows selectable")

    auto_select = Field(
        OneOfVal(BoolVal(), ChoiceVal(ON_DATA_UPDATE)), default=False,
        doc="""Pass true to make table autoselect first row if no row is selected,
        pass 'on_data_update' to make it autoselect first row on each data
        update.
        """)

    selected = StateField(
        StrVal(),
        doc="Selected row")

    on_select = Field(
        ActionVal(), default=undefined)


class Select(Widget):

    name = 'Select'
    js_type = 'rex-widget/lib/Select'

    id = Field(StrVal)
    options = Field(SeqVal, default=undefined)
    data = CollectionField(default=undefined)
    title_for_empty = Field(StrVal, default=undefined)
    no_empty_value = Field(BoolVal(), default=False)

    @Widget.define_state(OneOfVal(StrVal()))
    def value(self, state, graph, request):
        if state.value is unknown:
            return Reset(self.default_value(state, graph, request))

        data = '%s/data' % self.id

        # if data is marked as dirty we need to check if current value is
        # still valid and reset it otherwise
        if data in graph.dirty:
            options = [o['id'] for o in graph[self.id].data.collection]
            if self.options:
                options = options + [o['id'] for o in self.options]
            if state.value not in options:
                return Reset(self.default_value(state, graph, request))

        return state.value

    def default_value(self, state, graph, request):
        """ Compute the default value if one isn't provided.

        The default implementation does nothing but subclasses can define own
        logic to define default value.
        
        :param state: Value state of the widget
        :type state: :class:`rex.widget.State`
        :param graph: State graph
        :type graph: :class:`rex.widget.StateGraph`
        :param graph: WSGI request
        :type request: :class:`webob.Request`
        """
        if self.no_empty_value:
            options = []
            if self.options:
                options += self.options
            if self.data:
                options += graph[self.id].data.collection
            if options:
                return options[0]['id']
        return None

    @value.set_dependencies
    def value_dependencies(self):
        return ['data'] if self.data else []


class TextInput(Widget):

    name = 'TextInput'
    js_type = 'rex-widget/lib/TextInput'

    id = Field(
        StrVal(),
        doc="""
        Widget ID.
        """)

    value = StateField(
        StrVal(), persistence=State.EPHEMERAL,
        doc="""
        Value.
        """)

    placeholder = Field(
        StrVal, default='',
        doc="""
        Placeholder value.
        """)

    amortization_enabled = Field(
        BoolVal(), default=False,
        doc="""
        If value change should amortized.
        """)


class Grid(Widget):
    """ Data Grid."""

    name = 'Grid'
    js_type = 'rex-widget/lib/Grid'

    id = Field(StrVal)

    data = CollectionField(
        paginate=True,
        include_meta=True,
        doc="""
        Dataset for a grid.
        """)

    height = Field(
        IntVal(),
        doc="""
        Grid's height in pixels.
        """)

    selectable = Field(BoolVal, default=False)
    auto_select = Field(BoolVal, default=False)
    selected = StateField(AnyVal)
    search = StateField(StrVal)
    columns = Field(AnyVal, default={})
    resizeable_columns = Field(BoolVal, default=False)
    sortable_columns = Field(BoolVal, default=False)
    hide_columns = Field(SeqVal(StrVal), default=[])
    show_columns = Field(MaybeVal(SeqVal(StrVal)), default=undefined)


class PanesField(Field):

    _validate = MapVal(StrVal(), WidgetVal())

    def __init__(self, **kwargs):
        super(PanesField, self).__init__(self._validate, **kwargs)

    def apply(self, widget, value):
        prop = {}
        state = []
        for k, widget in value.items():
            descriptor = widget.descriptor()
            prop[k] = descriptor.ui
            state = state + descriptor.state.values()
        return {self.name: prop}, state


class Pane(Widget):
    """ Pane."""

    name = 'Pane'
    js_type = 'rex-widget/lib/Pane'

    id = Field(
        StrVal())

    panes = PanesField()

    active_pane = StateField(
        StrVal())

    class_name = Field(
        StrVal(), default=undefined)


class Placeholder(Widget):
    """ Placeholder."""

    name = 'Placeholder'
    js_type = 'rex-widget/lib/Placeholder'

    states = Field(SeqVal(StrVal()))

    placeholder = Field(
        WidgetVal(), default=NullWidget())

    children = Field(
        WidgetVal(), default=NullWidget())


class Notice(Widget):

    name = 'Notice'
    js_type = 'rex-widget/lib/Notice'

    text = Field(StrVal())


class Tab(Widget):

    name = 'Tab'
    js_type = 'rex-widget/lib/Tab'

    id = Field(
        StrVal(),
        doc="""
        Tab identifier.
        """)

    title = Field(
        StrVal(), default=undefined,
        doc="""
        Tab title.
        """)

    disabled = Field(
        BoolVal(), default=False,
        doc="""
        If tab should be disabled.
        """)

    children = Field(
        WidgetVal(), default=NullWidget(),
        doc="""
        Tab contents.
        """)


class Tabs(Widget):

    name = 'Tabs'
    js_type = 'rex-widget/lib/Tabs'

    tabs = Field(
        WidgetVal(widget_class=Tab),
        doc="""
        Tab widgets.
        """)

    active = StateField(
        StrVal(), doc="""
        Currently active tab.
        """)
