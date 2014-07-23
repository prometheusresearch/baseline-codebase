"""

    rex.widget_demo
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import StrVal
from rex.widget import Widget, EntityVal

class StudyInfo(Widget):

    name = 'StudyInfo'
    js_type = 'rex-widget-demo/lib/StudyInfo'

    fields = [
        ('id', StrVal),
        ('data', EntityVal)
    ]
