

from rex.web import HandleError as BaseHandleError
from rex.widget import Widget, Field, render_widget
from rex.core import StrVal, UIntVal
from webob import Response


class Error(Widget):

    name = 'Error'
    js_type = 'rex-widget-chrome/lib/Error'

    code = Field(UIntVal())
    title = Field(StrVal())
    explanation = Field(StrVal())
    url = Field(StrVal())



class HandleError(BaseHandleError):

    code = '*'

    def widget(self, req):
        return Error(code=self.error.code,
                     title=self.error.title,
                     explanation=self.error.explanation,
                     url=req.url)

    def __call__(self, req):
        response = render_widget(self.widget(req), req)
        response.status = self.error.code
        return response



