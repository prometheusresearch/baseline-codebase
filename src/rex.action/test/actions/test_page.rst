Page action
===========

::

  >>> from webob import Request

  >>> from rex.core import Rex
  >>> from rex.widget import render_widget
  >>> from rex.action import Action

Init
----

::

  >>> rex = Rex('-', 'rex.action_demo')
  >>> rex.on()

In case fields are not specified, they are generated from port::

  >>> page = Action.parse("""
  ... type: page
  ... id: home
  ... text: |
  ...   Welcome to Rex Action!
  ... """)

  >>> page # doctest: +NORMALIZE_WHITESPACE
  Page(icon=undefined,
       width=undefined,
       id='home',
       title=undefined,
       text=RST(src=u'<p>Welcome to Rex Action!</p>', links={}))

  >>> input, output = page.context_types

  >>> input
  RecordType(rows={}, open=True)

  >>> output
  RecordType(rows={}, open=True)

  >>> print render_widget(page, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-action/lib/actions/Page", ...]]

Cleanup
-------

::

  >>> rex.off()

