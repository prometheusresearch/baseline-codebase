"""

    rex.widget.library
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal, BoolVal, SeqVal, MapVal

from .widget import Widget
from .field import Field
from .util import undefined, MaybeUndefinedVal
from .column import ColumnVal
from .param import ParamVal
from .url import URLVal
from .formfield import FormFieldVal
from .dataspec import EntitySpecVal, CollectionSpecVal

__all__ = ('DataGrid',)


class DataGrid(Widget):

    name = 'DataGrid'
    js_type = 'rex-widget/lib/modern/library/DataGrid'

    columns = Field(SeqVal(ColumnVal()))
    data = Field(MaybeUndefinedVal(CollectionSpecVal()), default=undefined)
    with_search_filter = Field(BoolVal(), default=False)
    search_placeholder = Field(MaybeUndefinedVal(StrVal()), default=undefined)


class Info(Widget):

    name = 'Info'
    js_type = 'rex-widget/lib/modern/Info'

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
    js_type = 'rex-widget/lib/modern/library/Link'

    href = Field(URLVal())
    text = Field(StrVal())
    params = Field(MapVal(StrVal(), ParamVal()), default={})


class LinkButton(Widget):

    name = 'LinkButton'
    js_type = 'rex-widget/lib/modern/library/LinkButton'

    href = Field(URLVal())
    icon = Field(StrVal(), default='link')
    quiet = Field(MaybeUndefinedVal(BoolVal()), default=undefined)
    success = Field(MaybeUndefinedVal(BoolVal()), default=undefined)
    danger = Field(MaybeUndefinedVal(BoolVal()), default=undefined)
    size = Field(MaybeUndefinedVal(StrVal()), default=undefined)
    align = Field(MaybeUndefinedVal(StrVal()), default=undefined)
    text = Field(StrVal())
    params = Field(MapVal(StrVal(), ParamVal()), default={})


class EntityForm(Widget):

    name = 'EntityForm'
    js_type = 'rex-widget/lib/modern/forms/EntityForm'
