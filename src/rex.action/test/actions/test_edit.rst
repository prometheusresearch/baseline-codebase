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

  >>> edit # doctest: +NORMALIZE_WHITESPACE

  Edit(icon=undefined,
       width=undefined,
       id='edit-individual',
       title=undefined,
       entity=RowType(name='individual', type=EntityType(name='individual', state=None)),
       db=None,
       fields=[StringFormField(value_key=['code'], required=True, label='Code'),
               EnumFormField(value_key=['sex'], label='Sex',
                             options=[Record(value='not-known', label='Not Known'),
                                      Record(value='male', label='Male'),
                                      Record(value='female', label='Female'),
                                      Record(value='not-applicable', label='Not Applicable')]),
               EntityFormField(value_key=['mother'], label='Mother',
                               data=Record(entity='individual', title='id()', mask=None)),
               EntityFormField(value_key=['father'], label='Father',
                               data=Record(entity='individual', title='id()', mask=None)),
               EntityFormField(value_key=['adopted_mother'], label='Adopted Mother',
                               data=Record(entity='individual', title='id()', mask=None)),
               EntityFormField(value_key=['adopted_father'], label='Adopted Father',
                               data=Record(entity='individual', title='id()', mask=None))],
       query=None,
       value={},
       input=RecordType(rows={}, open=True),
       submit_button=undefined)

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
  Edit(icon=undefined, 
       width=undefined,
       id='edit-individual',
       title=undefined,
       entity=RowType(name='individual', type=EntityType(name='individual', state=None)),
       db=None,
       fields=[StringFormField(value_key=['code'], required=True, label='Code')],
       query=None,
       value={},
       input=RecordType(rows={}, open=True),
       submit_button=undefined)

  >>> edit.port
  Port('''
  entity: individual
  select: [code]
  with:
  - calculation: meta:type
    expression: '''individual'''
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
  - calculation: meta:type
    expression: '''individual'''
  ''')

Cleanup
-------

::

  >>> rex.off()
