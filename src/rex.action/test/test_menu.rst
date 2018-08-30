Menu integration
================

::

  >>> import tempfile
  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')

  >>> from webob import Request
  >>> from rex.core import Rex, SandboxPackage
  >>> from rex.core import StrVal
  >>> from rex.web import route
  >>> from rex.widget import Widget, Field

::

  >>> pkg = SandboxPackage()
  >>> pkg.rewrite('menu.yaml', """
  ... menu:
  ... - title: Home
  ...   items:
  ...   - title: Start
  ...     access: anybody
  ...     path: /page
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - simple:
  ...       actions:
  ...         simple:
  ...           type: pick
  ...           entity: individual
  ... """)
  >>> rex = Rex(pkg, '-', 'rex.action', attach_dir=attach_dir, db='pgsql:action_demo')
  >>> rex.on()

::

  >>> print(Request.blank('/page').get_response(rex)) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
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

  >>> print(Request.blank('/page', accept='application/json').get_response(rex)) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  ...
  <BLANKLINE>
  ["~#widget", ...]

::

  >>> rex.off()


