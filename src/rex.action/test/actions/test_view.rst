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
    View(icon=undefined,
         input={'individual': 'individual'},
         output={},
         id='view-individual',
         title=undefined,
         entity=EntityDeclaration(name='individual', type='individual'),
         fields=[StringFormField(value_key=['code'], required=True, label='Code'),
                 StringFormField(value_key=['sex'], required=True, label='Sex'),
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
  ["~#widget",["rex-workflow/lib/Actions/View",...]]

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
  ... - value_key: code
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE
  View(icon=undefined,
       input={'individual': 'individual'},
       output={},
       id='view-individual',
       title=undefined,
       entity=EntityDeclaration(name='individual', type='individual'),
       fields=[StringFormField(value_key=['code'], required=True, label='Code')])

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
  ... entity: {mother: individual}
  ... fields:
  ... - value_key: code
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE
  View(icon=undefined,
       input={'mother': 'individual'},
       output={},
       id='view-mother',
       title=undefined,
       entity=EntityDeclaration(name='mother', type='individual'),
       fields=[StringFormField(value_key=['code'], required=True, label='Code')])

  >>> view.port
  Port('''
  entity: individual
  select: [code]
  ''')

Cleanup
-------

::

  >>> rex.off()
