View action
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

  >>> drop= Action.parse("""
  ... type: drop
  ... id: drop-individual
  ... entity: individual
  ... """)

  >>> drop # doctest: +NORMALIZE_WHITESPACE
  Drop(confirm_delay=undefined,
       db=None,
       doc=undefined,
       entity=RowType(name='individual', type=EntityType(name='individual', state=None)),
       icon=undefined,
       id='drop-individual',
       message=RST(src=u'<p>You are about to drop an entity</p>', links={}),
       title=undefined,
       width=undefined)

  >>> input, output = drop.context_types

  >>> input
  RecordType(rows={'individual': RowType(name='individual', type=EntityType(name='individual', state=None))}, open=True)

  >>> output
  RecordType(rows={}, open=True)

  >>> drop.port
  Port('''
  entity: individual
  select: [code, sex, mother, father]
  with:
  - calculation: meta:type
    expression: '''individual'''
  - calculation: meta:title
    expression: id()
  ''')

  >>> print render_widget(
  ...   drop,
  ...   Request.blank('/', accept='application/json'),
  ...   no_chrome=True) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>

  >>> print render_widget(
  ...   drop,
  ...   Request.blank('/', accept='application/json'),
  ...   path='1.data',
  ...   no_chrome=True) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...

Cleanup
-------

::

  >>> rex.off()
