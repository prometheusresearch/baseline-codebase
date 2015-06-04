View action
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

  >>> view = Action.validate("""
  ... type: view
  ... id: view-individual
  ... entity: individual
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE
  View(icon=undefined,
       width=undefined,
       id='view-individual',
       title=undefined,
       input=OrderedDict(),
       entity=EntityDeclaration(name='individual', type='individual'),
       db=None,
       fields=[StringFormField(value_key=['code'], required=True, label='Code'),
               EnumFormField(value_key=['sex'], label='Sex',
                             options=[Record(value='not-known', label='not-known'),
                                      Record(value='male', label='male'),
                                      Record(value='female', label='female'),
                                      Record(value='not-applicable', label='not-applicable')]),
               EntityFormField(value_key=['mother'], label='Mother',
                               data=Record(entity='individual', title='id()', mask=None)),
               EntityFormField(value_key=['father'], label='Father',
                               data=Record(entity='individual', title='id()', mask=None)),
               EntityFormField(value_key=['adopted_mother'], label='Adopted Mother',
                               data=Record(entity='individual', title='id()', mask=None)),
               EntityFormField(value_key=['adopted_father'], label='Adopted Father',
                               data=Record(entity='individual', title='id()', mask=None))])

  >>> view.context()
  ({'individual': 'individual'}, {})

  >>> view.port
  Port('''
  entity: individual
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  ''')

  >>> print render_widget(view, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-action/lib/Actions/View",
                {..., {"*": ["~#contextbinding", [["individual"], true]]}]]}]]

  >>> print render_widget(view, Request.blank('/?__to__=1.data', accept='application/json')) # doctest: +ELLIPSIS
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

  >>> view = Action.validate("""
  ... type: view
  ... id: view-individual
  ... entity: individual
  ... fields:
  ... - value_key: code
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE
  View(icon=undefined,
       width=undefined,
       id='view-individual',
       title=undefined,
       input=OrderedDict(),
       entity=EntityDeclaration(name='individual', type='individual'),
       db=None,
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
       width=undefined,
       id='view-mother',
       title=undefined,
       input=OrderedDict(),
       entity=EntityDeclaration(name='mother', type='individual'),
       db=None,
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
