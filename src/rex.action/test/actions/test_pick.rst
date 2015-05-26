Pick action
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

  >>> pick = Action.validate("""
  ... type: pick
  ... id: pick-individual
  ... entity: individual
  ... """)

  >>> pick.columns # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code'),
   StringFormField(value_key=['sex'], required=True, label='Sex'),
   StringFormField(value_key=['mother'], label='Mother'),
   StringFormField(value_key=['father'], label='Father'),
   StringFormField(value_key=['adopted_mother'], label='Adopted Mother'),
   StringFormField(value_key=['adopted_father'], label='Adopted Father')]

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
  ["~#widget",["rex-wizard/lib/Actions/Pick",...]]

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

If we provide ``search`` HTSQL expression then we have port generated with
corresponding filtera and ``data`` data spec automatically bind ``search`` state
var to this filter::

  >>> pick = Action.validate("""
  ... type: pick
  ... id: pick-individual-search
  ... entity: individual
  ... search: identity.givename~$search
  ... """)

  >>> pick.port
  Port('''
  entity: individual
  filters: ['__search__($search) := identity.givename~$search']
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  ''')

  >>> pick.data(Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE
  CollectionSpec(route=PortURL(route='http://localhost/', params={'__to__': 'data'}),
                 params={'*:__search__': StateBinding(name='search')})

If we provide ``mask`` HTSQL expression it is compiled into port's mask::


  >>> pick = Action.validate("""
  ... type: pick
  ... id: pick-male
  ... entity: individual
  ... mask: sex = 'male'
  ... """)

  >>> pick.port
  Port('''
  entity: individual
  mask: sex='male'
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  ''')

If we provide ``input`` fields with context requirements then ``mask`` can refer
to those input variables::

  >>> pick = Action.validate("""
  ... type: pick
  ... id: pick-study-enrollment
  ... entity: study_enrollment
  ... mask: individual = $individual
  ... input:
  ... - individual: individual
  ... """)

  >>> pick.port # doctest: +NORMALIZE_WHITESPACE
  Port('''
  entity: study_enrollment
  filters: ['__mask__($individual) := individual=$individual']
  select: [study, individual, code, enrollment_date, participant_group, consent_form_scan, measure]
  ''')

  >>> pick.data(Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE
  CollectionSpec(route=PortURL(route='http://localhost/', params={'__to__': 'data'}),
                 params={'*:__mask__': ContextBinding(keys=['individual'])})

Cleanup
-------

::

  >>> rex.off()

