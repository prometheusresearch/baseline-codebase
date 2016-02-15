Test rex.widget.map
===================

::

  >>> from webob import Request, Response
  >>> from rex.core import Rex, SandboxPackage
  >>> from rex.widget import Widget, responder

  >>> class MappedWidget(Widget):
  ...     name = 'MappedWidget'
  ...     js_type = 'mapped-widget'
  ...
  ...     @responder()
  ...     def respond(self, req):
  ...         return Response(json='ok')

  >>> pkg = SandboxPackage('main')

  >>> pkg.rewrite('/urlmap/base.yaml', '''
  ... paths: {}
  ... ''')
  >>> pkg.rewrite('/urlmap.yaml', '''
  ... paths:
  ...   /w:
  ...     widget: !<MappedWidget>
  ...     access: anybody
  ... ''')

  >>> rex = Rex(pkg, '-', 'rex.widget_demo')
  >>> rex.on()

::

  >>> print Request.blank(
  ...   '/w',
  ...   accept='application/json').get_response(rex) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome", {...}]]

  >>> print Request.blank(
  ...   '/w/@@/1.content.1.respond',
  ...   accept='application/json').get_response(rex) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  "ok"

::

  >>> rex.off()
