"""

    rex.widget_demo
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

import cgi

from rex.core import Validate, StrVal, AnyVal, IntVal
from rex.widget import (
    Widget, Page, IDField, Field, EntityField, WidgetVal, NullWidget)

from rex.web import Command, Parameter
from webob import Response

class FileVal(Validate):

    def __call__(self, value):
        if not isinstance(value, cgi.FieldStorage):
            raise Error('not a file')
        if value.file is None or value.filename is None:
            raise Error('not a file')
        return value


class ApplicationAttachmentCommand(Command):

    path = '/data/application/attachment'
    parameters = [
        Parameter('file', FileVal())
    ]

    def render(self, request, file=None):
        return Response(json={'id': file.filename})


class StudyInfo(Widget):
    """ Show information about the study"""

    name = 'StudyInfo'
    js_type = 'rex-widget-demo/lib/StudyInfo'

    id      = IDField()
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

        
