"""

    rex.widget.modern.library
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import BoolVal, SeqVal

from ..widget import Widget
from ..validate import WidgetVal
from ..field import Field
from ..undefined import undefined
from ..library.datatable import ColumnVal
from .dataspec import EntitySpecVal, CollectionSpecVal
from .info_field import InfoFieldVal

__all__ = ('ListWithInfo',)


class ListWithInfo(Widget):

    name = 'ModernListWithInfo'
    js_type = 'rex-widget/lib/modern/ListWithInfo'

    list_data = Field(CollectionSpecVal())

    info_data = Field(EntitySpecVal(), default=undefined)

    list = Field(WidgetVal(), default=undefined)

    info = Field(WidgetVal(), default=undefined)


class DataTable(Widget):

    name = 'ModernDataTable'
    js_type = 'rex-widget/lib/modern/DataTable'

    columns = Field(
        SeqVal(ColumnVal()),
        doc="""
        Columns for individual list table.
        """)

    resizable_columns = Field(
        BoolVal(), default=False)

    selectable = Field(
        BoolVal(), default=False)
