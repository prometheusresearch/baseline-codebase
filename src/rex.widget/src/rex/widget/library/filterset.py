"""

    rex.study.recruitment_admin.widget
    ==================================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import cached
from rex.core import BoolVal, StrVal, AnyVal

from ..library.layout import HBox, Box
from ..widget import NullWidget
from ..field import Field, StateField
from ..validate import WidgetVal

__all__ = ('FilterSet', 'Filter')


class FilterSet(HBox):
    """ A set of filters.
    """

    name = 'FilterSet'
    js_type = 'rex-widget/lib/FilterSet'

    filters = Field(
        WidgetVal(), default=NullWidget(),
        doc="""
        A set of filters.
        """)

    value = StateField(AnyVal())

    apply_on_change = Field(
        BoolVal(), default=False,
        doc="""
        If filter set should apply on each change.
        """)

    @cached
    def descriptor(self):
        desc = super(FilterSet, self).descriptor()
        return desc


class Filter(Box):
    """ Filter."""

    name = 'Filter'
    js_type = 'rex-widget/lib/Filter'

    property = Field(
        StrVal())

    filter = Field(
        WidgetVal())
