"""

    rex.widget.library
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal, BoolVal, SeqVal, MapVal, AnyVal

from .widget import Widget
from .validate import WidgetVal
from .field import Field, computed_field
from .util import undefined, MaybeUndefinedVal
from .column import ColumnVal
from .param import ParamVal
from .url import URLVal
from .formfield import FormFieldVal, FormFieldsetVal
from .rst import RSTVal

__all__ = ('DataGrid',)


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
    js_type = 'rex-widget', 'Link'

    href = Field(URLVal())
    text = Field(StrVal())
    params = Field(MapVal(StrVal(), ParamVal()), default={})


class Form(Widget):
    """ Form widget."""

    name = 'Form'
    js_type = 'rex-widget', 'ConfigurableEntityForm'

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
    js_type = 'rex-widget', 'TextareaField'


class SourceCodeField(Widget):
    name = 'SourceCodeField'
    js_type = 'rex-widget', 'SourceCodeField'


class JsonSourceCodeField(Widget):
    name = 'JsonSourceCodeField'
    js_type = 'rex-widget', 'JsonSourceCodeField'


class DatetimeField(Widget):

    name = 'DatetimeField'
    js_type = 'rex-widget', 'DateTimeField'

    format = Field(
        StrVal(), default='YYYY-MM-DD HH:MM:SS',
        doc="""
        Datetime format string (affect rendering only, value still be formatted
        as an ISO formatted string).
        """)


class DateField(Widget):

    name = 'DateField'
    js_type = 'rex-widget', 'DateField'

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


class IFrame(Widget):

    name = 'IFrame'
    js_type = 'rex-widget', 'IFrame'

    transfer_request_params = Field(BoolVal(), default=False)
    src = Field(URLVal())

    @computed_field
    def query_string(self, request):
        return request.query_string

    @computed_field
    def request_params(self, request):
        return dict((pair for pair in list(request.params.items()))) \
               if self.transfer_request_params else {}
