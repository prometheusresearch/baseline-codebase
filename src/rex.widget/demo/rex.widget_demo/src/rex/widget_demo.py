"""

    rex.widget_demo
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import StrVal, AnyVal, cached
from rex.widget import (
    Widget, Page, Field, EntityField, WidgetVal, NullWidget,
    ContextValue)

class StudyInfo(Widget):
    """ Show information about the study"""

    name = 'StudyInfo'
    js_type = 'rex-widget-demo/lib/StudyInfo'

    id      = Field(StrVal)
    data    = EntityField()
