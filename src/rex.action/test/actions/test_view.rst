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

  >>> view = Action.parse("""
  ... type: view
  ... entity: individual
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  View(...)

  >>> input, output = view.context_types

  >>> input # doctest: +NORMALIZE_WHITESPACE
  RecordType(rows={'individual': RowType(name='individual',
                                         type=EntityType(name='individual', state=None))},
             open=True)

  >>> output
  RecordType(rows={}, open=True)

  >>> view.port
  Port('''
  - parameter: individual
  - entity: individual
    select: [code, sex, mother, father]
    with:
    - calculation: meta:type
      expression: '''individual'''
    - calculation: meta:title
      expression: id()
  ''')

  >>> print(render_widget(
  ...   view,
  ...   Request.blank('/', accept='application/json'),
  ...   no_chrome=True)) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  ...

  >>> print(render_widget(
  ...   view,
  ...   Request.blank('/', accept='application/json'),
  ...   no_chrome=True,
  ...   path='2.data')) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "individual": [...]
  }
  <BLANKLINE>

You can also specify fields and see port generated from them::

  >>> view = Action.parse("""
  ... type: view
  ... entity: individual
  ... fields:
  ... - value_key: code
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  View(...)

  >>> view.port
  Port('''
  - parameter: individual
  - entity: individual
    select: [code]
    with:
    - calculation: meta:type
      expression: '''individual'''
    - calculation: meta:title
      expression: id()
  ''')

You can specify view action for entities which have custom labels within the
context::

  >>> view = Action.parse("""
  ... type: view
  ... entity: {mother: individual}
  ... fields:
  ... - value_key: code
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  View(...)

  >>> view.port
  Port('''
  - parameter: mother
  - entity: individual
    select: [code]
    with:
    - calculation: meta:type
      expression: '''individual'''
    - calculation: meta:title
      expression: id()
  ''')

Cleanup
-------

::

  >>> rex.off()

