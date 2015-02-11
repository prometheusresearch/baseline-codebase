"""

    rex.widget.library.datatable
    ============================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import Validate, AnyVal, RecordVal, OneOfVal, SeqVal, StrVal
from rex.core import StrVal, BoolVal, IntVal, ChoiceVal
from ..action import ActionVal
from ..undefined import undefined, MaybeUndefinedVal
from ..field import Field, StateField, CollectionField
from ..json_encoder import register_adapter
from .layout import Box

__all__ = ('DataTable',)


class KeyPathVal(Validate):

    _validate = OneOfVal(StrVal(), SeqVal(StrVal()))

    def __call__(self, value):
        if isinstance(value, tuple):
            return value
        value = self._validate(value)
        if isinstance(value, basestring):
            if '.' in value:
                value = tuple(value.split('.'))
            else:
                value = (value,)
        return value


class ColumnVal(Validate):
    """ Column specification validator."""

    _validate_column = RecordVal(
        ('key', KeyPathVal()),
        ('name', StrVal()),
        ('sortable', MaybeUndefinedVal(BoolVal()), undefined),
        ('width', IntVal(), None),
        ('fixed', BoolVal(), False),
    )
    _validate = OneOfVal(_validate_column, KeyPathVal())

    def __call__(self, value):
        value = self._validate(value)
        if not isinstance(value, self._validate_column.record_type):
            value = self._validate_column.record_type(key=value)
        return value


@register_adapter(ColumnVal._validate_column.record_type)
def _encode_ColumnVal(val):
    return {k: v for k, v in val._asdict().items() if v is not undefined}


class DataTable(Box):
    """ Data table component.
    
    Use this component if you need to visualize a large amount of data.
    """

    name = 'DataTable'
    js_type = 'rex-widget/lib/DataTable'

    data = CollectionField(
        paginate=True,
        doc="""
        Dataset specification.
        """)

    sortable = Field(
        BoolVal(), default=False,
        doc="""
        If data table should allow sorting an underlying dataset.
        """)

    selectable = Field(
        BoolVal(), default=False,
        doc="""
        If data table should allow selecting rows.
        """)

    selected = StateField(
        AnyVal(),
        doc="""
        Identifier of the currently selected record or `None`.
        """)

    columns = Field(
        SeqVal(ColumnVal()),
        doc="""
        Column specification.
        """)

    on_select = Field(
        ActionVal(), default=undefined,
        doc="""
        Action to execute when row is selected.
        """)


