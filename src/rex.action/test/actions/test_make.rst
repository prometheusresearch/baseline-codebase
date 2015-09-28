Make action
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

  >>> make = Action.parse("""
  ... type: make
  ... id: make-individual
  ... entity: individual
  ... """)

  >>> make # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Make(icon=undefined,
       width=undefined, 
       id='make-individual', 
       title=undefined, 
       entity=RowType(name='individual', type=EntityType(name='individual', state=None)), 
       db=None, 
       fields=[...], 
       query=None, 
       value={}, 
       input=RecordType(rows={}, open=True), 
       submit_button=undefined)

  >>> input, output = make.context_types

  >>> input
  RecordType(rows={}, open=True)

  >>> output
  RecordType(rows={'individual': RowType(name='individual', type=EntityType(name='individual', state=None))}, open=True)

  >>> make.port
  Port('''
  entity: individual
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  with:
  - calculation: meta:type
    expression: '''individual'''
  ''')

  >>> print render_widget(make, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-action/lib/actions/Make", ...]]

  >>> print render_widget(make, Request.blank('/?__to__=1.data', accept='application/json')) # doctest: +ELLIPSIS
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

  >>> make = Action.parse("""
  ... type: make
  ... id: make-individual
  ... entity: individual
  ... fields:
  ... - value_key: code
  ... """)

  >>> make # doctest: +NORMALIZE_WHITESPACE
  Make(icon=undefined,
       width=undefined,
       id='make-individual',
       title=undefined,
       entity=RowType(name='individual', type=EntityType(name='individual', state=None)),
       db=None,
       fields=[StringFormField(value_key=['code'], label='Code')],
       query=None,
       value={}, 
       input=RecordType(rows={}, open=True),
       submit_button=undefined)

  >>> make.port
  Port('''
  entity: individual
  select: [code]
  with:
  - calculation: meta:type
    expression: '''individual'''
  ''')

Value also used to generate port::

  >>> make = Action.parse("""
  ... type: make
  ... id: make-individual
  ... entity: individual
  ... value:
  ...   code: code
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
  - calculation: meta:type
    expression: '''individual'''
  ''')

Port propagates its input parameters so ports of fieldset::

  >>> make = Action.parse("""
  ... type: make
  ... id: make-individual
  ... entity: individual
  ... input:
  ... - mother: individual
  ... fields:
  ... - value_key: mother
  ... """)
  
  >>> make.fields[0].query_port
  Port('''
  - parameter: mother
  - entity: individual
    select: []
    with:
    - calculation: title
      expression: id()
  ''')

Cleanup
-------

::

  >>> rex.off()
