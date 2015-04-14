"""

    rex.widget.modern.library
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal, BoolVal, IntVal, AnyVal, SeqVal

from ..widget import Widget
from ..field import Field
from ..undefined import undefined
from ..library.datatable import ColumnVal
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
