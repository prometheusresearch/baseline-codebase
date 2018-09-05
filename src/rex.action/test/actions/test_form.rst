Test rex.action.actions.form
============================

Setup::

  >>> import json
  >>> import tempfile
  >>> from webob import Request
  >>> from rex.core import Error, Rex
  >>> from rex.port import Port
  >>> from rex.action import Action, override

  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')
  >>> app = Rex('-', 'rex.action_demo', attach_dir=attach_dir)
  >>> app.on()

  >>> port = Port('individual')
  >>> try:
  ...    _ = port.delete([{'id': 'ok'}])
  ... except Error:
  ...   pass
  >>> _ = port.insert([{'code': 'ok'}])

Read only configuration
-----------------------

Value can be specified as HTSQL query::

  >>> action = Action.parse('''
  ... type: form
  ... fields:
  ... - code
  ... - identity.fullname
  ... input:
  ... - ind: individual
  ... value: |
  ...   /individual[$ind]
  ... ''') # doctest: +ELLIPSIS

  >>> action.read_only.computator(action, None)
  True

  >>> action.context_types.input
  RecordType(rows={'ind': RowType(name='ind', type=EntityType(name='individual', state=None))}, open=True)

  >>> action.context_types.output
  RecordType(rows={}, open=True)

  >>> req = Request.blank('/', accept='application/json')
  >>> print(action.data_mutation.respond(req)) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  webob.exc.HTTPBadRequest: form action is configured as read-only

  >>> req = Request.blank('/?ind=ok', accept='application/json')
  >>> print(action.data_value.respond(req)) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="Individual.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "individual": [
      {
        "code": "ok",
        "sex": "not-known",
        "mother": null,
        "father": null
      }
    ]
  }
  <BLANKLINE>

Value can be specified as an object::

  >>> action = Action.parse('''
  ... type: form
  ... fields:
  ... - code
  ... - identity.fullname
  ... input:
  ... - ind: individual
  ... value:
  ...   individual: $ind
  ... ''') # doctest: +ELLIPSIS

  >>> req = Request.blank('/?ind=ok', accept='application/json')
  >>> print(action.data_value.respond(req)) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  webob.exc.HTTPBadRequest: value is not provided via HTSQL query

Writable configuration without entity
-------------------------------------

::

  >>> action = Action.parse('''
  ... type: form
  ... fields:
  ... - sex
  ... input:
  ... - ind: individual
  ... value: |
  ...   /individual[$ind]
  ... query: |
  ...   update(individual[$ind] { id(), sex := $sex })
  ... ''') # doctest: +ELLIPSIS

  >>> action.context_types.input
  RecordType(rows={'ind': RowType(name='ind', type=EntityType(name='individual', state=None))}, open=True)

  >>> action.read_only.computator(action, None)
  False

  >>> action.context_types.output
  RecordType(rows={}, open=True)

  >>> req = Request.blank('/?ind=ok', accept='application/json')
  >>> print(action.data_value.respond(req)) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="Individual.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "individual": [
      {
        "code": "ok",
        "sex": "not-known",
        "mother": null,
        "father": null
      }
    ]
  }
  <BLANKLINE>

  >>> req = Request.blank(
  ...   '/?:ind=ok',
  ...   accept='application/json',
  ...   POST={'new': json.dumps([{'sex': 'male'}])})
  >>> print(action.data_mutation.respond(req)) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  null

  >>> port.produce(('*', 'ok')).data.individual[0].sex
  'male'

Writable configuration with entity
----------------------------------

::

  >>> action = Action.parse('''
  ... type: form
  ... fields:
  ... - sex
  ... entity: individual
  ... input:
  ... - ind: individual
  ... value: |
  ...   /individual[$ind]
  ... query: |
  ...   /do(
  ...     update(individual[$ind] { id(), sex := $sex }),
  ...     { id := $ind }
  ...   )
  ... ''') # doctest: +ELLIPSIS

  >>> action.context_types.input
  RecordType(rows={'ind': RowType(name='ind', type=EntityType(name='individual', state=None))}, open=True)

  >>> action.context_types.output
  RecordType(rows={'individual': RowType(name='individual', type=EntityType(name='individual', state=None))}, open=True)

  >>> req = Request.blank('/?ind=ok', accept='application/json')
  >>> print(action.data_value.respond(req)) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="Individual.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "individual": [
      {
        "code": "ok",
        "sex": "male",
        "mother": null,
        "father": null
      }
    ]
  }
  <BLANKLINE>

  >>> req = Request.blank(
  ...   '/?:ind=ok',
  ...   accept='application/json',
  ...   POST={'new': json.dumps([{'sex': 'male'}])})
  >>> print(action.data_mutation.respond(req)) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "individual": [
      {
        "id": "ok",
        "meta:type": "individual",
        "meta:title": "ok"
      }
    ]
  }
  <BLANKLINE>

  >>> port.produce(('*', 'ok')).data.individual[0].sex
  'male'

  >>> _ = port.replace({'id': 'ok'}, {'sex': 'non-known'})

Invalid configuration
---------------------

::

  >>> action = Action.parse('''
  ... type: form
  ... fields:
  ... - code
  ... - identity.fullname
  ... ''') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Either value or query should be provided
  While parsing:
      "<...>", line 2

Overrides
---------

::

  >>> action = Action.parse('''
  ... type: form
  ... fields:
  ... - code
  ... - identity.fullname
  ... input:
  ... - ind: individual
  ... value:
  ...   individual: $ind
  ... ''') # doctest: +ELLIPSIS

  >>> override(action, {'fields': ['code']}).fields
  [StringFormField(value_key=['code'])]


Teardown::

  >>> _ = port.delete([{'id': 'ok'}])
  >>> app.off()

