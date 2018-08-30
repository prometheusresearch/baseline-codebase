Test rex.widget.commands
========================

/widget/authorize
-----------------

::

  >>> from webob import Request
  >>> from rex.core import Rex, SandboxPackage

  >>> pkg = SandboxPackage('main')
  >>> pkg.rewrite('/urlmap.yaml', '''
  ... paths:
  ...   /ok:
  ...     port: individual
  ...     access: anybody
  ...   /notok:
  ...     port: individual
  ...     access: nobody
  ... ''')
  >>> rex = Rex(pkg, 'rex.widget_demo')
  >>> rex.on()

::

  >>> print(Request.blank('/widget/authorized?access=main:/ok').get_response(rex)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  {"authorized":true}

  >>> print(Request.blank('/widget/authorized?access=/ok').get_response(rex)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  {"authorized":true}

  >>> print(Request.blank('/widget/authorized?access=main:/notok').get_response(rex)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  {"authorized":false}

  >>> print(Request.blank('/widget/authorized?access=main:/unknown').get_response(rex)) # doctest: +ELLIPSIS
  501 Not Implemented
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  Cannot obtain access for main:/unknown

::

  >>> rex.off()

