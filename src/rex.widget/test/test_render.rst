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
  >>> print(render_widget(WidgetToRender(field='ok'), req)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  ...

::

  >>> req = Request.blank('/', accept='application/json', environ={
  ...   'rex.mount':  {
  ...     'rex.widget_demo': '/widget_demo'
  ...   }
  ... })
  >>> print(render_widget(WidgetToRender(field='ok'), req)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::rex-widget", "Chrome", {...]]

::

  >>> req = Request.blank('/', accept='application/json', environ={
  ...   'rex.mount':  {
  ...     'rex.widget_demo': '/widget_demo'
  ...   }
  ... })
  >>> print(render_widget(
  ...   WidgetToRender(field='ok'), req,
  ...   no_chrome=True)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::pkg", "widget-to-render", {...]]

::

  >>> req = Request.blank('/', accept='application/json')
  >>> print(render_widget(
  ...   WidgetToRender(field='ok'), req,
  ...   path='2.content.2.respond')) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  "ok"

::

  >>> req = Request.blank('/', accept='application/json')
  >>> print(render_widget(
  ...   WidgetToRender(field='ok'), req,
  ...   path='2.content.2.invalid_respond')) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  webob.exc.HTTPBadRequest: invalid path "2.content.2.invalid_respond" at key "invalid_respond"

  >>> req = Request.blank('/', accept='application/json')
  >>> print(render_widget(
  ...   WidgetToRender(field='ok'), req,
  ...   path='1.content.1')) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  webob.exc.HTTPBadRequest: unable to locate responder via selector

::

  >>> rex.off()

