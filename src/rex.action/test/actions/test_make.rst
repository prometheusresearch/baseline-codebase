Make action
===========

::

  >>> from webob import Request

  >>> from rex.core import Rex
  >>> from rex.widget import render_widget
  >>> from rex.wizard import Action

Init
----

::

  >>> rex = Rex('-', 'rex.wizard_demo')
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
               EnumFormField(value_key=['sex'], label='Sex',
                             options=[Record(value='not-known', label='not-known'),
                                      Record(value='male', label='male'),
                                      Record(value='female', label='female'),
                                      Record(value='not-applicable', label='not-applicable')]),
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

  >>> print render_widget(make, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-wizard/lib/Actions/Make",
               {..., "data": ["~#entity", [["~#port", ["http://localhost/?__to__=1.data"]],
                                           {}]]}]]

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
