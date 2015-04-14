"""

    rex.widget.modern.library
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Validate, Error, RecordVal
from rex.core import StrVal, BoolVal, IntVal, AnyVal, SeqVal, MapVal, OneOfVal

from ..widget import Widget
from ..field import Field
from ..undefined import undefined
from ..library.datatable import ColumnVal
from .param import ParamVal
from .url import URLVal
from .info_field import InfoFieldVal as FieldVal
from .dataspec import EntitySpecVal, CollectionSpecVal

__all__ = ('DataGrid',)


class DataGrid(Widget):

    name = 'DataGrid'
    js_type = 'rex-widget/lib/modern/library/DataGrid'

    columns = Field(SeqVal(ColumnVal()))
    data = Field(CollectionSpecVal(), default=undefined)
    with_search_filter = Field(BoolVal(), default=False)


class Info(Widget):

    name = 'Info'
    js_type = 'rex-widget/lib/modern/Info'

    data = Field(EntitySpecVal(), default=undefined)
    fields = Field(SeqVal(FieldVal()))


class Link(Widget):

    name = 'MLink'
    js_type = 'rex-widget/lib/modern/library/Link'

    href = Field(URLVal())
    text = Field(StrVal())
    params = Field(MapVal(StrVal(), ParamVal()), default={})


class LinkButton(Widget):

    name = 'MLinkButton'
    js_type = 'rex-widget/lib/modern/library/LinkButton'

    href = Field(URLVal())
    icon = Field(StrVal(), default='link')
    quiet = Field(BoolVal(), default=undefined)
    success = Field(BoolVal(), default=undefined)
    danger = Field(BoolVal(), default=undefined)
    size = Field(StrVal(), default=undefined)
    align = Field(StrVal(), default=undefined)
    text = Field(StrVal())
    params = Field(MapVal(StrVal(), ParamVal()), default={})
