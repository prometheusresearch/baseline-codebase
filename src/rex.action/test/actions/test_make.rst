Make action
===========

::

  >>> from webob import Request

  >>> from rex.core import Rex
  >>> from rex.widget import render_widget
  >>> from rex.workflow import Action

Init
----

::

  >>> rex = Rex('-', 'rex.workflow_demo')
  >>> rex.on()

In case fields are not specified, they are generated from port::

  >>> make = Action.validate("""
  ... type: make
  ... id: make-individual
  ... entity: individual
  ... """)

  >>> make # doctest: +NORMALIZE_WHITESPACE
  Make(icon=undefined,
       id='make-individual',
       title=undefined,
       entity=EntityDeclaration(name='individual', type='individual'),
       value={},
       fields=[StringFormField(value_key=['code'], required=True, label='Code'),
               StringFormField(value_key=['sex'], required=True, label='Sex'),
               StringFormField(value_key=['mother'], label='Mother'),
               StringFormField(value_key=['father'], label='Father'),
               StringFormField(value_key=['adopted_mother'], label='Adopted Mother'),
               StringFormField(value_key=['adopted_father'], label='Adopted Father')])

  >>> make.context()
  ({}, {'individual': 'individual'})

  >>> make.port
  Port('''
  entity: individual
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  ''')

  >>> print render_widget(make, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget",["rex-workflow/lib/Actions/Make",...]]

  >>> print render_widget(make, Request.blank('/?__to__=data', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: 1716
  <BLANKLINE>
  {
    "individual": [...]
  }
  <BLANKLINE>

You can also specify fields and see port generated from them::

  >>> make = Action.validate("""
  ... type: make
  ... id: make-individual
  ... entity: individual
  ... fields:
  ... - value_key: code
  ... """)

  >>> make # doctest: +NORMALIZE_WHITESPACE
  Make(icon=undefined,
       id='make-individual',
       title=undefined,
       entity=EntityDeclaration(name='individual', type='individual'),
       value={},
       fields=[StringFormField(value_key=['code'], required=True, label='Code')])

  >>> make.port
  Port('''
  entity: individual
  select: [code]
  ''')

Cleanup
-------

::

  >>> rex.off()
