URL mapping integration
=======================

::

  >>> import tempfile
  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')

  >>> from webob import Request
  >>> from rex.core import Rex, SandboxPackage
  >>> from rex.core import StrVal
  >>> from rex.widget import Widget, Field

::

  >> pkg = SandboxPackage()
  >> pkg.rewrite('urlmap.yaml', """
  ... paths:
  ...   /page:
  ...     access: anybody
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - simple:
  ...       actions:
  ...         simple:
  ...           type: pick
  ...           entity: individual
  ... """)
  >> rex = Rex(pkg, '-', 'rex.action_demo', attach_dir=attach_dir)
  >> rex.on()

::

  >> print Request.blank('/page').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
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

  >> print Request.blank('/page', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome", ...]]

  >> print Request.blank('/page/@@/1.content.1.path.0.0.action_instance.1.fields.3', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  ...
  <BLANKLINE>
  {
    "individual": [
      ...
    ]
  }

::

  >> rex.off()

Overrides
---------

::

  >> pkg = SandboxPackage(name='base')
  >> extension_pkg = SandboxPackage(name='main')

  >> pkg.rewrite('/urlmap/base.yaml', """
  ... paths:
  ...   /page:
  ...     access: anybody
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - simple:
  ...       actions:
  ...         simple:
  ...           type: pick
  ...           entity: individual
  ... """)

  >> extension_pkg.rewrite('/urlmap.yaml', """
  ... include: base:/urlmap/base.yaml
  ... paths:
  ...   /page: !override
  ...     access: nobody
  ... """)

  >> rex = Rex(extension_pkg, pkg, '-', 'rex.action_demo')

::

  >>> pkg = SandboxPackage(name='base')
  >>> extension_pkg = SandboxPackage(name='main')

  >>> pkg.rewrite('/urlmap/base.yaml', """
  ... paths:
  ...   /page:
  ...     access: anybody
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - simple:
  ...       actions:
  ...         simple:
  ...           type: pick
  ...           entity: individual
  ... """)

  >>> extension_pkg.rewrite('/urlmap.yaml', """
  ... include: base:/urlmap/base.yaml
  ... paths:
  ...   /page/@/simple: !override
  ...     entity: study
  ... """)

  >>> rex = Rex(extension_pkg, pkg, '-', 'rex.action_demo', attach_dir=attach_dir)

  >>> print Request.blank('/page/@@/1.content.1.path.0.0.2.1.data', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "study": [
      ...
    ]
  }

::

  >>> pkg = SandboxPackage(name='base')
  >>> extension_pkg = SandboxPackage(name='main')

  >>> pkg.rewrite('/urlmap/base.yaml', """
  ... paths:
  ...   /page:
  ...     access: anybody
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - included:
  ...       actions:
  ...         included: /included
  ...
  ...   /included:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - simple:
  ...       actions:
  ...         simple:
  ...           type: pick
  ...           entity: individual
  ... """)

  >>> extension_pkg.rewrite('/urlmap.yaml', """
  ... include: base:/urlmap/base.yaml
  ... paths:
  ...   /included/@/simple: !override
  ...     entity: study
  ... """)

  >>> rex = Rex(extension_pkg, pkg, '-', 'rex.action_demo', attach_dir=attach_dir)

  >>> print Request.blank(
  ...   '/page/@@/1.content.1.path.0.0.2.1.path.0.0.2.1.data',
  ...   accept='application/json'
  ... ).get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "study": [
      ...
    ]
  }

::

  >>> pkg = SandboxPackage(name='base')
  >>> extension_pkg = SandboxPackage(name='main')

  >>> pkg.rewrite('/urlmap.yaml', """
  ... paths:
  ...   /page:
  ...     access: anybody
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - included:
  ...       actions:
  ...         included: /included
  ...
  ...   /included:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - simple:
  ...       actions:
  ...         simple:
  ...           type: pick
  ...           entity: individual
  ... """)

  >>> extension_pkg.rewrite('/urlmap.yaml', """
  ... include: base:/urlmap.yaml
  ... paths:
  ...   /included/@/simple: !override
  ...     entity: study
  ... """)

  >>> rex = Rex(extension_pkg, pkg, '-', 'rex.action_demo', attach_dir=attach_dir)

  >>> print Request.blank(
  ...   '/page/@@/1.content.1.path.0.0.2.1.path.0.0.2.1.data',
  ...   accept='application/json'
  ... ).get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "study": [
      ...
    ]
  }

::

  >>> pkg = SandboxPackage(name='base')
  >>> extension_pkg = SandboxPackage(name='main')

  >>> pkg.rewrite('/urlmap/base.yaml', """
  ... paths:
  ...   /included:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - simple:
  ...       actions:
  ...         simple:
  ...           type: pick
  ...           entity: individual
  ... """)

  >>> extension_pkg.rewrite('/urlmap.yaml', """
  ... include: base:/urlmap/base.yaml
  ... paths:
  ...   /included/@/simple: !override
  ...     entity: study
  ...
  ...   /page:
  ...     access: anybody
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - included:
  ...       actions:
  ...         included: /included
  ...
  ... """)

  >>> rex = Rex(extension_pkg, pkg, '-', 'rex.action_demo', attach_dir=attach_dir)

  >>> print Request.blank(
  ...   '/page/@@/1.content.1.path.0.0.2.1.path.0.0.2.1.data',
  ...   accept='application/json'
  ... ).get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "study": [
      ...
    ]
  }
