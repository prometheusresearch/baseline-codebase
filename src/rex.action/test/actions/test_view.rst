View action
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

  >>> view = Action.validate("""
  ... type: view
  ... id: view-individual
  ... entity: individual
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE
  View(icon=None,
       input={'individual': 'individual'},
       output={},
       id='view-individual',
       title=None,
       entity='individual',
       fields=[StringFormField(value_key=['id'], label='id'),
               StringFormField(value_key=['code'], label='Code'),
               StringFormField(value_key=['sex'], label='Sex'),
               StringFormField(value_key=['mother'], label='Mother'),
               StringFormField(value_key=['father'], label='Father'),
               StringFormField(value_key=['adopted_mother'], label='Adopted Mother'),
               StringFormField(value_key=['adopted_father'], label='Adopted Father')])

  >>> view.context()
  ({'individual': 'individual'}, {})

  >>> view.port
  Port('''
  entity: individual
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  ''')

  >>> print render_widget(view, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget",["rex-workflow/lib/Actions/View",["^ ","title",null,"fields",[...],"entity","individual","output",["^ "],"input",["^ ","individual","individual"],"id","view-individual","icon",null,"data",["~#port",["http://localhost/?__to__=data"]]]]]

  >>> print render_widget(view, Request.blank('/?__to__=data', accept='application/json')) # doctest: +ELLIPSIS
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

  >>> view = Action.validate("""
  ... type: view
  ... id: view-individual
  ... entity: individual
  ... fields:
  ... - value_key: id
  ... - value_key: code
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE
  View(icon=None,
       input={'individual': 'individual'},
       output={},
       id='view-individual',
       title=None,
       entity='individual',
       fields=[StringFormField(value_key=['id']),
               StringFormField(value_key=['code'])])

  >>> view.port
  Port('''
  entity: individual
  select: [code]
  ''')

You can specify view action for entities which have custom labels within the
context::

  >>> view = Action.validate("""
  ... type: view
  ... id: view-mother
  ... entity: mother
  ... input:
  ...   mother: individual
  ... fields:
  ... - value_key: id
  ... - value_key: code
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE
  View(icon=None,
       input={'mother': 'individual'},
       output={},
       id='view-mother',
       title=None,
       entity='mother',
       fields=[StringFormField(value_key=['id']),
               StringFormField(value_key=['code'])])

  >>> view.port
  Port('''
  entity: individual
  select: [code]
  ''')

Cleanup
-------

::

  >>> rex.off()
