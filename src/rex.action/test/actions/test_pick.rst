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
   EnumFormField(value_key=['sex'], label='Sex',
                 options=[Record(value='not-known', label='not-known'),
                         Record(value='male', label='male'),
                         Record(value='female', label='female'),
                         Record(value='not-applicable', label='not-applicable')]),
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

  >>> req = Request.blank('/', accept='application/json')
  >>> print render_widget(pick, req) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-wizard/lib/Actions/Pick",
                {"contextSpec": {"input": {}, "output": {"individual": "individual"}},
                 "search": null,
                 "title": ["~#undefined", []],
                 "mask": null,
                 "entity": {"name": "individual", "type": "individual"},
                 "^2": {},
                 "id": "pick-individual",
                 "columns": [...],
                 "icon": ["^7", []],
                 "data": ["~#collection", [["~#port", ["http://localhost/?__to__=1.data"]], {}]]}]]

  >>> req = Request.blank('/?__to__=1.data', accept='application/json')
  >>> print render_widget(pick, req) # doctest: +ELLIPSIS
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

If we provide ``search`` HTSQL expression then we have port generated with
corresponding filtera and ``data`` data spec automatically bind ``search`` state
var to this filter::

  >>> pick = Action.validate("""
  ... type: pick
  ... id: pick-individual-search
  ... entity: individual
  ... search: identity.givename~$search
  ... """)

  >>> req = Request.blank('/', accept='application/json')
  >>> print render_widget(pick, req) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-wizard/lib/Actions/Pick",
                {"contextSpec": {"input": {}, "output": {"individual": "individual"}},
                 "search": "identity.givename~$search",
                 "title": ["~#undefined", []],
                 "mask": null,
                 "entity": {"name": "individual", "type": "individual"},
                 "^2": {},
                 "id": "pick-individual-search",
                 "columns": [...],
                 "icon": ["^7", []],
                 "data": ["~#collection", [["~#port", ["http://localhost/?__to__=1.data"]],
                                           {"*:__search__": ["~#statebinding", ["search"]]}]]}]]

  >>> pick.port
  Port('''
  entity: individual
  filters: ['__search__($search) := identity.givename~$search']
  select: [code, sex, mother, father, adopted_mother, adopted_father]
  ''')

  >>> req = Request.blank('/?__to__=1.data', accept='application/json')
  >>> print render_widget(pick, req) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "individual": [
      ...
    ]
  }
  <BLANKLINE>

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

  >>> req = Request.blank('/', accept='application/json')
  >>> print render_widget(pick, req) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: 1336
  <BLANKLINE>
  ["~#widget", ["rex-wizard/lib/Actions/Pick",
                {"contextSpec": {"input": {"individual": "individual"},
                 "output": {"study_enrollment": "study_enrollment"}},
                 "search": null,
                 "title": ["~#undefined", []],
                 "mask": "individual = $individual",
                 "entity": {"name": "study_enrollment", "type": "study_enrollment"},
                 "^2": {"^3": "individual"},
                 "id": "pick-study-enrollment",
                 "columns": [...],
                 "icon": ["^8", []],
                 "data": ["~#collection", [["~#port", ["http://localhost/?__to__=1.data"]],
                                           {"*:__mask__": ["~#contextbinding", [["individual"]]]}]]}]]

  >>> pick.port # doctest: +NORMALIZE_WHITESPACE
  Port('''
  entity: study_enrollment
  filters: ['__mask__($individual) := individual=$individual']
  select: [study, individual, code, enrollment_date, participant_group, consent_form_scan, measure]
  ''')

  >>> req = Request.blank('/?__to__=1.data', accept='application/json')
  >>> print render_widget(pick, req) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "study_enrollment": [
      ...
    ]
  }
  <BLANKLINE>

Cleanup
-------

::

  >>> rex.off()

