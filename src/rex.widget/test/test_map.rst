Test rex.widget.map
===================

::

  >>> from webob import Request, Response
  >>> from rex.core import Rex, SandboxPackage
  >>> from rex.widget import Widget, responder

  >>> class MappedWidget(Widget):
  ...     name = 'MappedWidget'
  ...     js_type = 'pkg', 'mapped-widget'
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

  >>> print(Request.blank(
  ...   '/w',
  ...   accept='application/json').get_response(rex)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget", "Chrome", {...}]]

  >>> print(Request.blank(
  ...   '/w/@@/2.content.2.respond',
  ...   accept='application/json').get_response(rex)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  "ok"

Overrides
---------

::

  >>> pkg.rewrite('/urlmap/base.yaml', '''
  ... paths:
  ...   /w:
  ...     widget: !<MappedWidget>
  ...     access: anybody
  ... ''')

  >>> pkg.rewrite('/urlmap.yaml', '''
  ... include:
  ... - /urlmap/base.yaml
  ... paths:
  ...   /w: !override
  ...     no_chrome: true
  ... ''')

  >>> print(Request.blank(
  ...   '/w',
  ...   accept='application/json').get_response(rex)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["pkg", "mapped-widget", {...}]]

  >>> pkg.rewrite('/urlmap.yaml', '''
  ... include:
  ... - /urlmap/base.yaml
  ... paths:
  ...   /w: !override
  ...     access: nobody
  ... ''')

  >>> print(Request.blank(
  ...   '/w',
  ...   accept='application/json').get_response(rex)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  401 Unauthorized
  ...

  >>> pkg.rewrite('/urlmap.yaml', '''
  ... include:
  ... - /urlmap/base.yaml
  ... paths:
  ...   /w: !override
  ...     title: NEWTITLE
  ... ''')

  >>> print(Request.blank(
  ...   '/w',
  ...   accept='application/json').get_response(rex)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget", "Chrome", {..., "title": "NEWTITLE"}]]

::

  >>> rex.off()

