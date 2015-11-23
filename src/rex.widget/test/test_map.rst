Test URL mapping bindings
=========================

::

  >>> from webob import Request
  >>> from rex.core import Rex, SandboxPackage
  >>> from rex.core import StrVal
  >>> from rex.widget import Widget, Field

  >>> class Screen(Widget):
  ...
  ...   name = 'Screen'
  ...   js_type = 'rex-widget/Screen'
  ...
  ...   title = Field(StrVal())

  >>> pkg = SandboxPackage()
  >>> pkg.rewrite('urlmap.yaml', """
  ... paths:
  ...   /page:
  ...     widget: !<Screen>
  ...       title: OK
  ...     access: anybody
  ... """)
  >>> rex = Rex(pkg, '-', 'rex.widget_demo')
  >>> rex.on()

  >>> print Request.blank('/page').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  ...
  <BLANKLINE>
  <html lang="en">
  <head>
  ...
  </head>
  <body>
  ...
  </body>
  </html>

  >>> print Request.blank('/page', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome",
                {"content": ["^0", ["rex-widget/Screen", {"title": "OK"}]],
                 "^2": "OK"}]]

It authorizes requests::

  >>> pkg.rewrite('urlmap.yaml', """
  ... paths:
  ...   /page:
  ...     widget: !<Screen>
  ...       title: OK
  ...     access: authenticated
  ... """)

  >>> print Request.blank('/page', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  401 Unauthorized
  Content-Length: ...
  Content-Type: text/plain; charset=UTF-8
  <BLANKLINE>
  401 Unauthorized
  <BLANKLINE>
  This server could not verify that you are authorized to access the document you requested. Either you supplied the wrong credentials (e.g., bad password), or your browser does not understand how to supply the credentials required.
  <BLANKLINE>
  <BLANKLINE>

Cleanup::

  >>> rex.off()

Overrides
---------

::

  >>> pkg = SandboxPackage()
  >>> pkg.rewrite('urlmap.yaml', """
  ... paths:
  ...   /page:
  ...     widget: !<Screen>
  ...       title: !slot
  ...         name: page_title
  ...         default: Page title
  ...     access: anybody
  ... """)

  >>> rex = Rex(pkg, '-', 'rex.widget_demo')
  >>> rex.on()

  >>> print Request.blank('/page', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome",
                {"content": ["^0", ["rex-widget/Screen", {"title": "Page title"}]],
                 "^2": "Page title"}]]

  >>> rex.off()

::

  >>> pkg = SandboxPackage(name='base')
  >>> extension_pkg = SandboxPackage(name='main')

  >>> pkg.rewrite('/urlmap/base.yaml', """
  ... paths:
  ...   /page:
  ...     widget: !<Screen>
  ...       title: !slot
  ...         name: page_title
  ...         default: Page title
  ...     access: anybody
  ...
  ... """)

  >>> extension_pkg.rewrite('/urlmap.yaml', """
  ... include: base:/urlmap/base.yaml
  ... paths:
  ...   /page: !override
  ...     slots:
  ...       page_title: overriden
  ... """)

  >>> rex = Rex(extension_pkg, pkg, '-', 'rex.widget_demo')

  >>> print Request.blank('/page', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome",
                {"content": ["^0", ["rex-widget/Screen",
                                    {"title": "overriden"}]],
                 "^2": "overriden"}]]

Override entire widget::

  >>> pkg = SandboxPackage(name='base')
  >>> extension_pkg = SandboxPackage(name='main')

  >>> pkg.rewrite('/urlmap/base.yaml', """
  ... paths:
  ...   /page:
  ...     widget: !<Screen>
  ...       title: !slot
  ...         name: page_title
  ...         default: Page title
  ...     access: anybody
  ...
  ... """)

  >>> extension_pkg.rewrite('/urlmap.yaml', """
  ... include: base:/urlmap/base.yaml
  ... paths:
  ...   /page: !override
  ...     widget: !<Screen>
  ...       title: New page title
  ... """)

  >>> rex = Rex(extension_pkg, pkg, '-', 'rex.widget_demo')

  >>> print Request.blank('/page', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome",
                {"content": ["^0", ["rex-widget/Screen",
                                    {"title": "New page title"}]],
                 "^2": "New page title"}]]

Override access::

  >>> pkg = SandboxPackage(name='base')
  >>> extension_pkg = SandboxPackage(name='main')

  >>> pkg.rewrite('/urlmap/base.yaml', """
  ... paths:
  ...   /page:
  ...     widget: !<Screen>
  ...       title: !slot
  ...         name: page_title
  ...         default: Page title
  ...     access: anybody
  ...
  ... """)

  >>> extension_pkg.rewrite('/urlmap.yaml', """
  ... include: base:/urlmap/base.yaml
  ... paths:
  ...   /page: !override
  ...     access: authenticated
  ... """)

  >>> rex = Rex(extension_pkg, pkg, '-', 'rex.widget_demo')

  >>> print Request.blank('/page', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  401 Unauthorized
  ...
  Content-Type: text/plain; charset=UTF-8
  <BLANKLINE>
  401 Unauthorized
  ...

::

  >>> pkg = SandboxPackage(name='base')
  >>> extension_pkg = SandboxPackage(name='main')

  >>> pkg.rewrite('/urlmap/base.yaml', """
  ... paths:
  ...   /page:
  ...     widget: !<Screen>
  ...       title: !slot
  ...         name: page_title
  ...         default: Page title
  ...     access: anybody
  ... """)

  >>> extension_pkg.rewrite('/urlmap.yaml', """
  ... include: base:/urlmap/base.yaml
  ... paths:
  ...   /page: !override
  ...     slots:
  ...       page_title: 1
  ... """)

  >>> rex = Rex(extension_pkg, pkg, '-', 'rex.widget_demo') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a string
  Got:
      1
  While parsing:
      ".../urlmap.yaml", line 6
  While validating field:
      title
  Of widget:
      Screen
  While initializing RexDB application:
      SandboxPackage('main')
      SandboxPackage('base')
      -
      rex.widget_demo
