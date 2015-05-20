Pick action
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

  >>> pick = Action.validate("""
  ... type: pick
  ... id: pick-individual
  ... entity: individual
  ... """)

  >>> pick # doctest: +NORMALIZE_WHITESPACE
  Pick(icon=None,
       input={},
       output={'individual': 'individual'},
       id='pick-individual',
       title=None,
       columns=[StringFormField(value_key=['id'], label='id'),
                StringFormField(value_key=['code'], label='Code'),
                StringFormField(value_key=['sex'], label='Sex'),
                StringFormField(value_key=['mother'], label='Mother'),
                StringFormField(value_key=['father'], label='Father'),
                StringFormField(value_key=['adopted_mother'], label='Adopted Mother'),
                StringFormField(value_key=['adopted_father'], label='Adopted Father')],
       filters=[],
       entity='individual',
       mask=None)

  >>> pick.context()
  ({}, {'individual': 'individual'})

  >>> pick.port
  Port('''
  entity: individual
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  ''')

  >>> print render_widget(pick, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget",["rex-workflow/lib/Actions/Pick",["^ ","title",null,"mask",null,"entity","individual","filters",[],"output",["^ ","individual","individual"],"input",["^ "],"id","pick-individual","columns",[...],"icon",null,"data",["~#port",["http://localhost/?__to__=data"]]]]]

  >>> print render_widget(pick, Request.blank('/?__to__=data', accept='application/json')) # doctest: +ELLIPSIS
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

Cleanup
-------

::

  >>> rex.off()

