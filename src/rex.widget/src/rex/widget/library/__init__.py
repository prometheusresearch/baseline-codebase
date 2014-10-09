"""

    rex.widget.library
    ==================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import (
    AnyVal, OneOfVal, SeqVal, StrVal, UStrVal, IntVal, BoolVal, MaybeVal,
    MapVal)

from ..widget import Widget, NullWidget, state, iterate, StateRead
from ..field import Field, StateField, CollectionField, PaginatedCollectionField
from ..state import unknown, State, Reset, Dep
from ..parse import WidgetVal

from .page import * # pylint: disable=wildcard-import
from .layout import * # pylint: disable=wildcard-import


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

    name = 'Table'
    js_type = 'rex-widget/lib/Table'

    id = Field(StrVal)
    data = CollectionField()
    columns = Field(SeqVal)
    selectable = Field(BoolVal, default=False)
    auto_select = Field(BoolVal, default=False)
    selected = StateField(StrVal, default=None)


class Select(Widget):

    name = 'Select'
    js_type = 'rex-widget/lib/Select'

    id = Field(StrVal)
    options = Field(SeqVal, default=None)
    data = CollectionField(default=None)
    title_for_empty = Field(StrVal, default=None)
    no_empty_value = Field(BoolVal(), default=False)

    @state(OneOfVal(StrVal()), default=None)
    def value(self, state, graph, request):
        if state.value is unknown:
            return Reset(None)

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

class FileAttachments(Widget):
    
    name = 'FileAttachments'
    js_type = 'rex-widget/lib/FileAttachments'

    attachments = Field(SeqVal(StrVal), default=[]);

