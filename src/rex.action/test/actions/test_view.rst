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

  >>> view = Action.parse("""
  ... type: view
  ... id: view-individual
  ... entity: individual
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  View(db=None,
       entity=RowType(name='individual', type=EntityType(name='individual', state=None)),
       fields=[...],
       icon=undefined,
       id='view-individual',
       input=RecordType(rows={}, open=True),
       title=undefined,
       width=undefined)

  >>> input, output = view.context_types

  >>> input # doctest: +NORMALIZE_WHITESPACE
  RecordType(rows={'individual': RowType(name='individual',
                                         type=EntityType(name='individual', state=None))},
             open=True)

  >>> output
  RecordType(rows={}, open=True)

  >>> view.port
  Port('''
  entity: individual
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  with:
  - calculation: meta:type
    expression: '''individual'''
  - calculation: meta:title
    expression: id()
  ''')

  >>> print render_widget(view, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-action/lib/actions/View", ...]]

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

  >>> view = Action.parse("""
  ... type: view
  ... id: view-individual
  ... entity: individual
  ... fields:
  ... - value_key: code
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE
  View(db=None,
       entity=RowType(name='individual', type=EntityType(name='individual', state=None)),
       fields=[StringFormField(value_key=['code'], label=u'Code')],
       icon=undefined,
       id='view-individual',
       input=RecordType(rows={}, open=True),
       title=undefined,
       width=undefined)

  >>> view.port
  Port('''
  entity: individual
  select: [code]
  with:
  - calculation: meta:type
    expression: '''individual'''
  - calculation: meta:title
    expression: id()
  ''')

You can specify view action for entities which have custom labels within the
context::

  >>> view = Action.parse("""
  ... type: view
  ... id: view-mother
  ... entity: {mother: individual}
  ... fields:
  ... - value_key: code
  ... """)

  >>> view # doctest: +NORMALIZE_WHITESPACE
  View(db=None,
       entity=RowType(name='mother', type=EntityType(name='individual', state=None)), 
       fields=[StringFormField(value_key=['code'], label=u'Code')],
       icon=undefined,
       id='view-mother',
       input=RecordType(rows={}, open=True),
       title=undefined,
       width=undefined)

  >>> view.port
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
