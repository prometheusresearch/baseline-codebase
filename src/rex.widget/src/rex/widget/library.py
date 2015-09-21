"""

    rex.widget.library
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal, BoolVal, SeqVal, MapVal, AnyVal

from .widget import Widget
from .validate import WidgetVal
from .field import Field
from .util import undefined, MaybeUndefinedVal
from .column import ColumnVal
from .param import ParamVal
from .url import URLVal
from .formfield import FormFieldVal, FormFieldsetVal
from .dataspec import EntitySpecVal, CollectionSpecVal
from .rst import RSTVal

__all__ = ('DataGrid',)


class Text(Widget):

    name = 'Text'
    js_type = 'rex-widget/lib/library/Text'

    text = Field(
        RSTVal(),
        doc="""
        Text in ReStructuredText format.
        """)


class DataGrid(Widget):

    name = 'DataGrid'
    js_type = 'rex-widget/lib/library/DataGrid'

    columns = Field(SeqVal(ColumnVal()))
    data = Field(MaybeUndefinedVal(CollectionSpecVal()), default=undefined)
    with_search_filter = Field(BoolVal(), default=False)
    search_placeholder = Field(MaybeUndefinedVal(StrVal()), default=undefined)


class Info(Widget):

    name = 'Info'
    js_type = 'rex-widget/lib/Info'

    data = Field(MaybeUndefinedVal(EntitySpecVal()), default=undefined)
    fields = Field(SeqVal(FormFieldVal()))


class Link(Widget):
    """
    ``<Link>`` widget is used to generate links between application pages and
    states::

        !<Link>
        text: John Doe
        href: pkg:/users
        params:
            username: johndoe

    The snippet above will generate a link to ``/pkg/users?username=johndoe``
    URL.
    """

    name = 'Link'
    js_type = 'rex-widget/lib/library/Link'

    href = Field(URLVal())
    text = Field(StrVal())
    params = Field(MapVal(StrVal(), ParamVal()), default={})


class LinkButton(Widget):

    name = 'LinkButton'
    js_type = 'rex-widget/lib/library/LinkButton'

    href = Field(URLVal())
    icon = Field(StrVal(), default='link')
    quiet = Field(MaybeUndefinedVal(BoolVal()), default=undefined)
    success = Field(MaybeUndefinedVal(BoolVal()), default=undefined)
    danger = Field(MaybeUndefinedVal(BoolVal()), default=undefined)
    size = Field(MaybeUndefinedVal(StrVal()), default=undefined)
    align = Field(MaybeUndefinedVal(StrVal()), default=undefined)
    text = Field(StrVal())
    params = Field(MapVal(StrVal(), ParamVal()), default={})


class Form(Widget):
    """ Form widget."""

    name = 'Form'
    js_type = 'rex-widget/lib/forms/ConfigurableEntityForm'

    entity = Field(
        StrVal(),
        doc="""
        Entity name.
        """)

    insert = Field(
        BoolVal(), default=False,
        doc="""
        If this should work as insert form.
        """)

    value = Field(
        AnyVal(), default=undefined,
        doc="""
        Initial form value.
        """)

    fields = Field(
        FormFieldsetVal(),
        doc="""
        Fields specification.
        """)


class TextareaField(Widget):

    name = 'TextareaField'
    js_type = 'rex-widget/lib/forms/TextareaField'


class DatetimeField(Widget):

    name = 'DatetimeField'
    js_type = 'rex-widget/lib/forms/DatetimeField'

    format = Field(
        StrVal(), default='YYYY-MM-DD HH:MM:SS',
        doc="""
        Datetime format string (affect rendering only, value still be formatted
        as an ISO formatted string).
        """)


class DateField(Widget):

    name = 'DateField'
    js_type = 'rex-widget/lib/forms/DateField'

    format = Field(
        StrVal(), default='YYYY-MM-DD',
        doc="""
        Date format string (affect rendering only, value still be formatted
        as an ISO formatted string).
        """)

    min_date = Field(
        StrVal(), default=None,
        doc="""
        The earliest date that may be set
        """)

    max_date = Field(
        StrVal(), default=None,
        doc="""
        The latest date that may be set
        """)
