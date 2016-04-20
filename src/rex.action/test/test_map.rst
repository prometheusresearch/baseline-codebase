URL mapping integration
=======================

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
  >>> pkg.rewrite('urlmap.yaml', """
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
  >>> rex = Rex(pkg, '-', 'rex.action_demo', attach_dir=attach_dir)
  >>> rex.on()

::

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
  ["~#widget", ...]

  >>> print Request.blank('/page/@@/1.content.1.actions.2306d33a20b822b4b1f18bd6405b7ad3.1.fields.3.widget.1.data', accept='application/json').get_response(rex) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
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
  >>> rex.on()

  >>> action = route('main:/page').action
  >>> action.typecheck()
  >>> action.path.then[0].action_instance.entity
  RowType(name='study', type=EntityType(name='study', state=None))

  >>> rex.off()

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
  >>> rex.on()

  >>> action = route('main:/page').action
  >>> action.typecheck()
  >>> action.path.then[0].action_instance.path.then[0].action_instance.entity
  RowType(name='study', type=EntityType(name='study', state=None))

  >>> rex.off()

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
  >>> rex.on()

  >>> action = route('main:/page').action
  >>> action.typecheck()
  >>> action.path.then[0].action_instance.path.then[0].action_instance.entity
  RowType(name='study', type=EntityType(name='study', state=None))

  >>> rex.off()

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
  >>> rex.on()

  >>> action = route('main:/page').action
  >>> action.typecheck()
  >>> action.path.then[0].action_instance.path.then[0].action_instance.entity
  RowType(name='study', type=EntityType(name='study', state=None))

  >>> rex.off()
