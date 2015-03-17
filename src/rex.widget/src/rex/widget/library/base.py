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
from ..field import Field, IDField, StateField, CollectionField, URLField
from ..undefined import undefined
from ..state import unknown, State, Reset, Dep
from ..validate import WidgetVal
from ..action import ActionVal
from .layout import Box
from .validators import TemplatedStrVal


class Label(Widget):
    """A widget to hold text.
    """

    name = 'Label'
    js_type = 'rex-widget/lib/Label'

    text = Field(
            TemplatedStrVal(),
            doc='The text to display.')


class Header(Widget):
    """A widget to display a header tag <h1>, <h2>, ...
    """
    name = 'Header'
    js_type = 'rex-widget/lib/Header'

    text = Field(
        TemplatedStrVal(),
        doc="The text of the header.")
    level = Field(
        IntVal(), default=1,
        doc="The level of the header 1, 2, ...")
    color = Field(
        StrVal(), default=undefined,
        doc="Text Color. (A CSS color)")


class Text(Box):
    """A !<Box> widget to display text.
    """

    name = 'Text'
    js_type = 'rex-widget/lib/Text'

    text = Field(
        TemplatedStrVal(),
        doc='The text to display.')

    font_size = Field(
        StrVal(), default=undefined,
        doc="Font size. (A CSS font-size)")

    color = Field(
        StrVal(), default=undefined,
        doc="Color. (A CSS color)")


class Button(Widget):
    """A widget to display a button.
    """

    name = 'Button'
    js_type = 'rex-widget/lib/Button'

    text = Field(
        TemplatedStrVal(), default=undefined,
        doc="""
        The text to appear on the button.
        """)

    icon = Field(
        StrVal(), default=undefined,
        doc="""
        Path to an image file of the button.
        """)

    icon_right = Field(
        StrVal(), default=undefined,
        doc="""
        Path to an image file displayed to the right of the button text.
        """)

    success = Field(
        BoolVal(), default=undefined,
        doc="""
        True/False => do/not render button in "Success" style.
        """)

    danger = Field(
        BoolVal(), default=undefined,
        doc="""
        True/False => do/not render button in "Danger" style.
        """)

    quiet = Field(
        BoolVal(), default=undefined,
        doc="""
        True/False => do/not render button in "Quiet" style.
        """)

    size = Field(
        ChoiceVal('small', 'extra-small'), default=undefined,
        doc="""
        Size of the button.
        """)

    class_name = Field(
        StrVal(), default=undefined,
        doc="""
        CSS class name used to render the button.
        """)

    on_click = Field(
        ActionVal(), default=undefined,
        doc="""
        Action on click.
        """)


class ButtonGroup(Box):
    """A !<Box> widget to display a list of buttons.
    """

    name = 'ButtonGroup'
    js_type = 'rex-widget/lib/ButtonGroup'

    buttons = Field(
            WidgetVal(Button),
            doc='')


class UnsafeHTML(Widget):
    """A widget which is like the !<Label> widget except the content may
    be raw HTML.
        
    This can be used to embed YouTube/Vimeo videos for example::

        !<UnsafeHTML>
        html: |
            <iframe ...></iframe>

    .. danger::
        This can result in XSS injection.
    """

    name = 'UnsafeHTML'
    js_type = 'rex-widget/lib/UnsafeHTML'

    html = Field(
            UStrVal(),
            doc='The raw HTML content.')


class Section(Widget):
    """Section.
    """
    name = 'Section'
    js_type = 'rex-widget/lib/Section'

    class_name = Field(
        StrVal(),
        default=undefined)

    content = Field(
        WidgetVal(),
        default=NullWidget())


class Icon(Widget):
    """Icon."""

    name = 'Icon'
    js_type = 'rex-widget/lib/Icon'

    name = Field(StrVal())


class Link(Widget):
    """Navigation link"""

    name = 'Link'
    js_type = 'rex-widget/lib/Link'

    href = URLField(
        doc="Link URL")

    text = Field(
        TemplatedStrVal(), default=undefined,
        doc="Link text")

    params = Field(
        MapVal(StrVal(), StrVal()), default={},
        doc="Link parameters")

    unsafe = Field(
        BoolVal(), default=False,
        doc="Do not validate ``href`` and ``params`` fields")


class LinkButton(Button):
    """A button which sends a request when the user clicks on it.
    """
    
    name = 'LinkButton'
    js_type = 'rex-widget/lib/LinkButton'

    href = URLField(
        doc="The Request URL.  See URLVal `<reference.html#urlval>`_")


class ActionLink(Widget):
    """Link that allows execution of an action instead of standard link"""

    name = 'ActionLink'
    js_type = 'rex-widget/lib/ActionLink'

    text = Field(
        TemplatedStrVal(), default=undefined,
        doc="Link text")

    on_click = Field(
        ActionVal(), default=undefined,
        doc="""
        Action on click.
        """)

    class_name = Field(
        StrVal(), default=undefined,
        doc="""
        CSS class name.
        """)


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
    """Table widget.
    """

    ON_DATA_UPDATE = 'on_data_update'

    column_type = RecordVal(
        ('key', ValueKeyVal()),
        ('title', StrVal())
    )

    name = 'Table'
    js_type = 'rex-widget/lib/Table'

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
    """Select.
    """
    name = 'Select'
    js_type = 'rex-widget/lib/Select'

    options = Field(
        SeqVal(), default=undefined)

    data = CollectionField(default=undefined)

    title_for_empty = Field(
        StrVal(), default=undefined)

    no_empty_value = Field(
        BoolVal(), default=False)

    quiet = Field(
        BoolVal(), default=undefined)

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
    """TextInput.
    """
    name = 'TextInput'
    js_type = 'rex-widget/lib/TextInput'

    value = StateField(
        StrVal(), persistence=State.EPHEMERAL,
        doc="""
        Value.
        """)

    placeholder = Field(
        StrVal, default=undefined,
        doc="""
        Placeholder value.
        """)

    quiet = Field(
        BoolVal(), default=undefined)

    amortization_enabled = Field(
        BoolVal(), default=False,
        doc="""
        If value change should amortized.
        """)


class PanesField(Field):
    """PanesField.
    """

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
    """Pane.
    """

    name = 'Pane'
    js_type = 'rex-widget/lib/Pane'

    panes = PanesField()

    active_pane = StateField(
        StrVal())

    class_name = Field(
        StrVal(), default=undefined)


class Placeholder(Widget):
    """Placeholder.
    """

    name = 'Placeholder'
    js_type = 'rex-widget/lib/Placeholder'

    states = Field(SeqVal(StrVal()))

    placeholder = Field(
        WidgetVal(), default=NullWidget())

    children = Field(
        WidgetVal(), default=NullWidget())


class Notice(Widget):
    """Notice.
    """

    name = 'Notice'
    js_type = 'rex-widget/lib/Notice'

    text = Field(
        TemplatedStrVal())


class Tab(Widget):
    """Tab.
    """

    name = 'Tab'
    js_type = 'rex-widget/lib/Tab'

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
    """Tabs.
    """

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

    buttons_style = Field(
        ChoiceVal('tabs', 'pills'), default='tabs',
        doc="""
        Style for tab buttons.
        """)

    buttons_position = Field(
        ChoiceVal('top', 'right', 'bottom', 'left'), default='top',
        doc="""
        Tab buttons position.
        """)


class IFrame(Widget):
    """IFrame.
    """

    name = 'IFrame'
    js_type = 'rex-widget/lib/IFrame'

    src = URLField(doc="iframe#src attribute")
