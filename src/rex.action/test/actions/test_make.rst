Make action
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

Field reflection
----------------

In case fields are not specified, they are generated from port::

  >>> make = Action.parse("""
  ... type: make
  ... entity: individual
  ... """)

  >>> make.fields # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  [StringFormField(value_key=['code'], ...),
   EnumFormField(value_key=['sex'], ...),
   EntityFormField(value_key=['mother'], ...),
   EntityFormField(value_key=['father'], ...)]

  >>> make.context_types.input
  RecordType(rows={}, open=True)

  >>> make.context_types.output
  RecordType(rows={'individual': RowType(name='individual', type=EntityType(name='individual', state=None))}, open=True)

  >>> make.port
  Port('''
  entity: individual
  select: [code, sex, mother, father]
  with:
  - calculation: meta:type
    expression: '''individual'''
  - calculation: meta:title
    expression: id()
  ''')

  >>> make.mutation.port
  Port('''
  entity: individual
  select: [code, sex, mother, father]
  with:
  - calculation: meta:type
    expression: '''individual'''
  - calculation: meta:title
    expression: id()
  ''')

  >>> print(render_widget(
  ...   make,
  ...   Request.blank('/', accept='application/json'),
  ...   no_chrome=True)) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  ...

  >>> print(render_widget(
  ...   make,
  ...   Request.blank('/', accept='application/json'),
  ...   no_chrome=True,
  ...   path='2.data')) # doctest: +ELLIPSIS
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

Port generation
---------------

You can also specify fields and see port generated from them::

  >>> make = Action.parse("""
  ... type: make
  ... entity: individual
  ... fields:
  ... - value_key: code
  ... """)

  >>> make.fields # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  [StringFormField(value_key=['code'], ...)]

  >>> make.port
  Port('''
  entity: individual
  select: [code]
  with:
  - calculation: meta:type
    expression: '''individual'''
  - calculation: meta:title
    expression: id()
  ''')

Value also used to generate port::

  >>> make = Action.parse("""
  ... type: make
  ... entity: individual
  ... value:
  ...   code: code
  ...   sex: female
  ...   identity:
  ...     fullname: Andrey
  ... fields:
  ... - value_key: code
  ... """)

  >>> make.port
  Port('''
  entity: individual
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

  >>> make.mutation.port
  Port('''
  entity: individual
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

Query
-----

::

  >>> make = Action.parse("""
  ... type: make
  ... entity: individual
  ... value:
  ...   code: code
  ...   sex: female
  ...   identity:
  ...     fullname: Andrey
  ... fields:
  ... - value_key: code
  ... query: |
  ...   insert(individual := { code := $code })
  ... """)

  >>> make.mutation.query
  Query('insert(individual:={code:=$code})')

Fields with layout
------------------

::

  >>> make = Action.parse("""
  ... type: make
  ... entity: individual
  ... fields:
  ... - row:
  ...   - value_key: code
  ... """)

  >>> make.port
  Port('''
  entity: individual
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

