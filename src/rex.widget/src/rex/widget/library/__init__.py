"""

    rex.widget.library
    ==================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import (
    AnyVal, OneOfVal, SeqVal, StrVal, UStrVal, IntVal, BoolVal, MaybeVal,
    MapVal, ChoiceVal)

from ..widget import Widget, NullWidget, state, iterate, StateRead
from ..field import Field, StateField, CollectionField, PaginatedCollectionField
from ..state import unknown, State, Reset, Dep
from ..parse import WidgetVal

from .page import * # pylint: disable=wildcard-import
from .layout import * # pylint: disable=wildcard-import
from .WidgetDoc import * # pylint: disable=wildcard-import


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

    content = Field(WidgetVal, default=NullWidget())


class Link(Widget):
    """ Navigation link"""

    name = 'Link'
    js_type = 'rex-widget/lib/Link'

    href = Field(
        StrVal(),
        doc="Link URL")
    text = Field(
        UStrVal(), default=None,
        doc="Link text")
    params = Field(
        MapVal(StrVal(), StrVal()), default={},
        doc="Link parameters")
    unsafe = Field(
        BoolVal(), default=False,
        doc="Do not validate ``href`` and ``params`` fields")


class Table(Widget):
    """ Table widget.
    """

    ON_DATA_UPDATE = 'on_data_update'

    name = 'Table'
    js_type = 'rex-widget/lib/Table'

    id = Field(
        StrVal(),
        doc="Widget identifier")

    data = CollectionField(
        doc="Table data")

    columns = Field(
        SeqVal(),
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
        StrVal(), default=None,
        doc="Selected row")


class Select(Widget):

    name = 'Select'
    js_type = 'rex-widget/lib/Select'

    id = Field(StrVal)
    options = Field(SeqVal, default=None)
    data = CollectionField(default=None)
    title_for_empty = Field(StrVal, default=None)
    no_empty_value = Field(BoolVal(), default=False)

    @state(OneOfVal(StrVal()))
    def value(self, state, graph, request):
        if (state.value is unknown):
            return Reset(self.default_value(state, graph, request))

        data = '%s/data' % self.id

        # if data is marked as dirty we need to check if current value is
        # still valid and reset it otherwise
        if state.value is not None and data in graph.dirty:
            options = [o['id'] for o in graph[data]['data']]
            if self.options is not None:
                options = [o['id'] for o in self.options]
            if state.value not in options:
                return Reset(None)

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
        return None

    @value.set_dependencies
    def value_dependencies(self):
        return ['data'] if self.data is not None else []


class TextInput(Widget):

    name = 'TextInput'
    js_type = 'rex-widget/lib/TextInput'

    id = Field(StrVal)
    value = StateField(StrVal, persistence=State.EPHEMERAL, default=None)
    placeholder = Field(StrVal, default='')


class Grid(Widget):
    """ Data Grid."""

    name = 'Grid'
    js_type = 'rex-widget/lib/Grid'

    id = Field(StrVal)
    data = PaginatedCollectionField(include_meta=True)
    selectable = Field(BoolVal, default=False)
    auto_select = Field(BoolVal, default=False)
    selected = StateField(AnyVal, default=None)
    search = StateField(StrVal, default=None)
    columns = Field(AnyVal, default={})
    resizeable_columns = Field(BoolVal, default=False)
    sortable_columns = Field(BoolVal, default=False)
    hide_columns = Field(SeqVal(StrVal), default=[])
    show_columns = Field(MaybeVal(SeqVal(StrVal)), default=None)

