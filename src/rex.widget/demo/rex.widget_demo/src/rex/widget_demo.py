"""

    rex.widget_demo
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import StrVal
from rex.widget import Widget, Field, EntityVal

class StudyInfo(Widget):

    name = 'StudyInfo'
    js_type = 'rex-widget-demo/lib/StudyInfo'


    id      = Field(StrVal)
    data    = Field(EntityVal)
