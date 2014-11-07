"""

    WidgetHelp
    ===============
    
    This provides self documenting descriptions of 
    all rex.widgets available to the application.

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import StrVal, AnyVal, IntVal, cached

from rex.web import Command, Parameter
from webob import Response
from rex.widget import (
    Widget, Page, Field, EntityField, WidgetVal, NullWidget,
    ContextValue)
        

class WidgetHelp(Command):

    path = '/widget_help'
    access = 'anybody'
    parameters = []

    def render(self, req):
    
        # pageTemplate takes divHtml
        pageTemplate = """
<html>
<head>
  <title>RexWidget Help</title>""" + self.getHelpCSS() + """
</head>
<body>
%s
</body>
</html>
"""        
        html = pageTemplate % ( self.getWidgetHelp() )

        return Response(html)



    # return div containing widget help          
    def getWidgetHelp(self):
    
        # divTemplate takes sideHtml, mainHtml
        divTemplate = """
  <div class="rexwidget-help">
    <div id="main-content">
      <h1>Widget Descriptions</h1>
      %s
    </div>
    <div id="left-sidebar">
      <h1>Available Widget List</h1>
      %s
      <br/><br/>
    </div>
    <div style="clear:both;"></div>
  </div>
"""        
        sideHtml = ""
        mainHtml = ""

        # sideTemplate takes  widgetName, widgetName
        sideTemplate = '<h4>Widget Name: <a rel="tag" href="#%s">%s</a></h4>'
        # mainTemplate takes  widgetName,  widgetName, className, widgetDoc, paramHtml
        mainTemplate = """
        <div>
        <h3 id="%s">Widget Name: %s</h3>
        <h4>Class Name: %s</h4>
         %s
         <h5>Parameters: </h5>
         %s
        </div>
        <hr/>
        """
        # paramTemplate takes  paramName, paramType, paramDefault, paramDoc
        paramTemplate = '<p>&nbsp;&nbsp;&nbsp;&nbsp; <b>%s</b> - <i>Type</i>: %s %s %s</p>'
        
        for w in Widget.all() :
        
          className = str(w)
          widgetName = str(w.name)
          widgetDoc = " <i>Description</i>: " +str(w.__doc__).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") if len(str(w.__doc__)) and w.__doc__ != None else ""
          
          paramHtml = ""
          
          for name, field in w.fields.items():
            paramName = str(name)
            paramType = str(field.validator)
            paramDefault = "<b> REQUIRED </b>" if str(field.default) == "NotImplemented" else " <i>Default</i>: " +str(field.default)
            paramDoc = " <i>Description</i>: " +str(field.__doc__).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") if len(str(field.__doc__)) and field.__doc__ != None else ""
            
            paramHtml = paramHtml + paramTemplate % (paramName, paramType, paramDefault, paramDoc)
            
          sideHtml = sideHtml + sideTemplate % (widgetName, widgetName)
          mainHtml = mainHtml + mainTemplate % (widgetName, widgetName, className, widgetDoc, paramHtml)

        html = divTemplate % (mainHtml, sideHtml)
        
        return html


    # return css needed for widget help display  
    def getHelpCSS(self):
    
      html = """
  <style>
    body {
      margin: 0 0 0 0;
      background-color:white;
    }
    #rexwidget-help {
      background:white;
      max-width: 100%%;
      height:100%%;
      position:relative;
    }
    #main-content {
      position:absolute;
      overflow-y:scroll;
      left:320px;
      right:0px;
      padding:30px;
      padding-top:20px;
    }
    #left-sidebar {
      background-color:lightblue;
      position:fixed;
      overflow-y:scroll;
      left:0px;
      width:320px;
      height:100%%;
      padding:10px;
      padding-top:20px;
    }
  </style>"""
      return html
    

