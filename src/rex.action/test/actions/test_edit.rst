Edit action
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

  >>> edit = Action.parse("""
  ... type: edit
  ... entity: individual
  ... """)

  >>> edit # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Edit(...)

  >>> input, output = edit.context_types

  >>> input
  RecordType(rows={'individual': RowType(name='individual', type=EntityType(name='individual', state=None))}, open=True)

  >>> output
  RecordType(rows={'individual': RowType(name='individual', type=EntityType(name='individual', state=None))}, open=True)

  >>> edit.port
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
  ...   edit,
  ...   Request.blank('/', accept='application/json'),
  ...   path='2.data',
  ...   no_chrome=True)) # doctest: +ELLIPSIS
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

  >>> edit = Action.parse("""
  ... type: edit
  ... entity: individual
  ... fields:
  ... - value_key: code
  ... """)

  >>> edit # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Edit(...)

  >>> edit.port
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

Edit's initial value is also used to generate port::

  >>> make = Action.parse("""
  ... type: edit
  ... entity: individual
  ... value:
  ...   sex: female
  ...   identity:
  ...     fullname: Andrey
  ... fields:
  ... - value_key: code
  ... """)

  >>> make.port
  Port('''
  - parameter: individual
  - entity: individual
    select: [code, sex]
    with:
    - entity: identity
      select: [fullname]
      with:
      - calculation: meta:type
        expression: '''identity'''
      - calculation: meta:title
        expression: id()
    - calculation: meta:type
      expression: '''individual'''
    - calculation: meta:title
      expression: id()
  ''')

Cleanup
-------

::

  >>> rex.off()

