Page action
===========

::

  >>> import tempfile
  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')

  >>> from webob import Request

  >>> from rex.core import Rex
  >>> from rex.widget import render_widget
  >>> from rex.action import Action

Init
----

::

  >>> rex = Rex('-', 'rex.action_demo', attach_dir=attach_dir)
  >>> rex.on()

In case fields are not specified, they are generated from port::

  >>> page = Action.parse("""
  ... type: page
  ... text: |
  ...   Welcome to Rex Action!
  ... """)

  >>> page # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Page(...)

  >>> input, output = page.context_types

  >>> input
  RecordType(rows={}, open=True)

  >>> output
  RecordType(rows={}, open=True)

  >>> print(render_widget(
  ...   page,
  ...   Request.blank('/', accept='application/json'),
  ...   no_chrome=True)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  ...

Cleanup
-------

::

  >>> rex.off()


