"""

    rex.widget_demo
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import StrVal, AnyVal, IntVal, cached
from rex.widget import (
    Widget, Page, Field, EntityField, WidgetVal, NullWidget,
    ContextValue)

from rex.web import Command, Parameter
from webob import Response
from rex.widget.widget import state


class StudyInfo(Widget):
    """ Show information about the study"""

    name = 'StudyInfo'
    js_type = 'rex-widget-demo/lib/StudyInfo'

    id      = Field(StrVal)
    data    = EntityField()




class MyHeader(Widget):
    """ Render header text based on data retrieved from database."""

    name = 'MyHeader'
    js_type = 'rex-widget-demo/lib/MyHeader'

    id    = Field(StrVal)
    text  = Field(StrVal(), default=None)
    data  = EntityField( default=None, doc="A port that returns a simple string which will be used as the header text." )
    level = Field(IntVal(), default=1)
    code  = Field(StrVal(), default=None)



class HTMLWidget(Widget):
    """ Render some html.
        Used for inserting static HTML that does not change during the life of the page.
        This widget should be used only sparingly and with caution."""

    name = 'HTMLWidget'
    js_type = 'rex-widget-demo/lib/HTMLWidget'

    html  = Field(StrVal())

        
