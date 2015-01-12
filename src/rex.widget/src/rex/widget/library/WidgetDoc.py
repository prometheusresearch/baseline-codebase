"""

    WidgetDoc
    ===============
    
    This provides self documenting descriptions of 
    all rex.widgets available to the application.
    Currently this uses a command that is presented
    in an iframe.  

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import StrVal, AnyVal, IntVal, cached
from ..widget import Widget


class WidgetDoc(Widget):
    """ Show documentation of all available widgets. 
        Note: Do not use the doc parameter below in your configuration.  
        Just provide an id for the widget that is unique within the page."""

    name = 'WidgetDoc'
    js_type = 'rex-widget/lib/WidgetDoc'
            
    @Widget.define_state(StrVal())
    def doc(self, state, graph, request):
        
        css = """
          <style>
            #doc { height: 100% }
            .rw-RexPage__content, rw-RexPage__content div { height: 100% }
          </style>"""

    
        # find all widgets and compose markup
        content = css + '<iframe width="100%" height="800px" frameborder="0" src="'+str(request.environ['rex.mount']['rex.widget'])+'/widget_help"></iframe>'

        return content
        

