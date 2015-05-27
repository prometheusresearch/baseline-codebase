Page action
===========

::

  >>> from webob import Request

  >>> from rex.core import Rex
  >>> from rex.widget import render_widget
  >>> from rex.wizard import Action

Init
----

::

  >>> rex = Rex('-', 'rex.wizard_demo')
  >>> rex.on()

In case fields are not specified, they are generated from port::

  >>> page = Action.validate("""
  ... type: page
  ... id: home
  ... text: |
  ...   Welcome to Rex Wizard!
  ... """)

  >>> page # doctest: +NORMALIZE_WHITESPACE
  Page(icon=undefined,
       id='home',
       title=undefined,
       text=RST(src=u'<p>Welcome to Rex Wizard!</p>', links={}))

  >>> page.context()
  ({}, {})

  >>> print render_widget(page, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-wizard/lib/Actions/Page", ...]]

Cleanup
-------

::

  >>> rex.off()

