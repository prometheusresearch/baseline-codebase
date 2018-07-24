Test rex.widget.render
======================

::

  >>> from webob import Request, Response
  >>> from rex.core import Rex, StrVal
  >>> from rex.widget import Widget, Field, responder
  >>> from rex.widget import render_widget

  >>> class WidgetToRender(Widget):
  ...     name = 'WidgetToRender'
  ...     js_type = 'pkg', 'widget-to-render'
  ...
  ...     field = Field(StrVal())
  ...
  ...     @responder()
  ...     def respond(self, req):
  ...         return Response(json='ok')


  >>> rex = Rex('-', 'rex.widget_demo')
  >>> rex.on()

::

  >>> req = Request.blank('/', environ={
  ...   'rex.mount':  {
  ...     'rex.widget_demo': '/widget_demo'
  ...   }
  ... })
  >>> print render_widget(WidgetToRender(field='ok'), req) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  ...

::

  >>> req = Request.blank('/', accept='application/json', environ={
  ...   'rex.mount':  {
  ...     'rex.widget_demo': '/widget_demo'
  ...   }
  ... })
  >>> print render_widget(WidgetToRender(field='ok'), req) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget", "Chrome", {...]]

::

  >>> req = Request.blank('/', accept='application/json', environ={
  ...   'rex.mount':  {
  ...     'rex.widget_demo': '/widget_demo'
  ...   }
  ... })
  >>> print render_widget(
  ...   WidgetToRender(field='ok'), req,
  ...   no_chrome=True) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["pkg", "widget-to-render", {...]]

::

  >>> req = Request.blank('/', accept='application/json')
  >>> print render_widget(
  ...   WidgetToRender(field='ok'), req,
  ...   path='2.content.2.respond') # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  "ok"

::

  >>> req = Request.blank('/', accept='application/json')
  >>> print render_widget(
  ...   WidgetToRender(field='ok'), req,
  ...   path='2.content.2.invalid_respond') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  HTTPBadRequest: invalid path "2.content.2.invalid_respond" at key "invalid_respond"

  >>> req = Request.blank('/', accept='application/json')
  >>> print render_widget(
  ...   WidgetToRender(field='ok'), req,
  ...   path='1.content.1') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  HTTPBadRequest: unable to locate responder via selector

::

  >>> rex.off()
