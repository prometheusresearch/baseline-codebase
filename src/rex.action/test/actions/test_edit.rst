Edit action
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

  >>> edit = Action.parse("""
  ... type: edit
  ... id: edit-individual
  ... entity: individual
  ... """)

  >>> edit # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Edit(db=None,
       entity=RowType(name='individual', type=EntityType(name='individual', state=None)),
       fields=[...],
       icon=undefined,
       id='edit-individual',
       input=RecordType(rows={}, open=True),
       query=None,
       submit_button=undefined,
       title=undefined,
       value={},
       width=undefined)

  >>> input, output = edit.context_types

  >>> input
  RecordType(rows={'individual': RowType(name='individual', type=EntityType(name='individual', state=None))}, open=True)

  >>> output
  RecordType(rows={'individual': RowType(name='individual', type=EntityType(name='individual', state=None))}, open=True)

  >>> edit.port
  Port('''
  entity: individual
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  with:
  - calculation: meta:type
    expression: '''individual'''
  - calculation: meta:title
    expression: id()
  ''')

  >>> print render_widget(edit, Request.blank('/?__to__=1.data', accept='application/json')) # doctest: +ELLIPSIS
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
  ... id: edit-individual
  ... entity: individual
  ... fields:
  ... - value_key: code
  ... """)

  >>> edit # doctest: +NORMALIZE_WHITESPACE
  Edit(db=None,
       entity=RowType(name='individual', type=EntityType(name='individual', state=None)),
       fields=[StringFormField(value_key=['code'], label=u'Code')],
       icon=undefined,
       id='edit-individual',
       input=RecordType(rows={}, open=True),
       query=None,
       submit_button=undefined,
       title=undefined,
       value={},
       width=undefined)

  >>> edit.port
  Port('''
  entity: individual
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
  ... id: edit-individual
  ... entity: individual
  ... value:
  ...   sex: female
  ...   identity:
  ...     givenname: Andrey
  ... fields:
  ... - value_key: code
  ... """)

  >>> make.port
  Port('''
  entity: individual
  select: [code, sex]
  with:
  - entity: identity
    select: [givenname]
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
