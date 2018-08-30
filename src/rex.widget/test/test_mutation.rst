Test rex.widget.mutation
========================

::

  >>> import json
  >>> from webob import Request
  >>> from rex.core import Rex, Error
  >>> from rex.port import Port
  >>> from rex.db import Query
  >>> from rex.widget import Mutation

  >>> rex = Rex('rex.widget_demo')
  >>> rex.on()


  >>> port = Port('individual')
  >>> try:
  ...    _ = port.delete([{'id': 'ok'}])
  ... except Error:
  ...   pass
  >>> _ = port.insert([{'code': 'ok'}])

::

  >>> mutation = Mutation(port)
  >>> print(mutation(Request.blank('/'))) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  HTTPMethodNotAllowed: The server could not comply with the request since it is either malformed or otherwise incorrect.

::

  >>> req = Request.blank('/',
  ...     method='POST',
  ...     content_type='multipart/form-data; boundary=boundary',
  ...     accept='application/json',
  ...     POST={
  ...       'old': json.dumps([{'id': 'ok', 'sex': 'not-known'}]),
  ...       'new': json.dumps([{'id': 'ok', 'sex': 'male'}]),
  ...     }
  ... )
  >>> print(mutation(req)) # doctest: +ELLIPSIS
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
        "code": "ok",
        "sex": "male",
        "mother": null,
        "father": null,
        "adopted_mother": null,
        "adopted_father": null
      }
    ]
  }
  <BLANKLINE>


::

  >>> mutation = Mutation(
  ...   Port('''
  ...   - parameter: individual
  ...   - individual
  ...   '''),
  ...   Query('''
  ...   update(individual[$individual]{ id(), sex := $sex })
  ...   '''))

  >>> req = Request.blank('/?:individual=ok',
  ...     method='POST',
  ...     content_type='multipart/form-data; boundary=boundary',
  ...     accept='application/json',
  ...     POST={
  ...       'old': json.dumps([{'id': 'ok', 'sex': 'male'}]),
  ...       'new': json.dumps([{'id': 'ok', 'sex': 'female'}]),
  ...     }
  ... )
  >>> print(mutation(req)) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  HTTPInternalServerError: query should return a record with an id field: { id := ...  }

::

  >>> mutation = Mutation(
  ...   Port('''
  ...   - parameter: individual
  ...   - individual
  ...   '''),
  ...   Query('''
  ...   /do(
  ...     update(individual[$individual]{ id(), sex := $sex }),
  ...     { id := $individual }
  ...   )
  ...   '''))

  >>> req = Request.blank('/?:individual=ok',
  ...     method='POST',
  ...     content_type='multipart/form-data; boundary=boundary',
  ...     accept='application/json',
  ...     POST={
  ...       'old': json.dumps([{'id': 'ok', 'sex': 'male'}]),
  ...       'new': json.dumps([{'id': 'ok', 'sex': 'female'}]),
  ...     }
  ... )
  >>> print(mutation(req)) # doctest: +ELLIPSIS
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
        "code": "ok",
        "sex": "female",
        "mother": null,
        "father": null,
        "adopted_mother": null,
        "adopted_father": null
      }
    ]
  }
  <BLANKLINE>

::

  >>> req = Request.blank('/?:individual=ok',
  ...     method='POST',
  ...     content_type='multipart/form-data; boundary=boundary',
  ...     accept='application/json',
  ...     POST={
  ...     }
  ... )
  >>> mutation(req).status # doctest: +ELLIPSIS
  '400 Bad Request'

  >>> req = Request.blank('/?:individual=ok',
  ...     method='POST',
  ...     content_type='multipart/form-data; boundary=boundary',
  ...     accept='application/json',
  ...     POST={
  ...       'new': 'xxx'
  ...     }
  ... )
  >>> mutation(req).status # doctest: +ELLIPSIS
  '400 Bad Request'

::

  >>> mutation = Mutation(
  ...   query=Query('''
  ...   /do(
  ...     update(individual[$individual]{ id(), sex := $sex }),
  ...     { id := $individual }
  ...   )
  ...   '''))
  >>> req = Request.blank('/?:individual=ok',
  ...     method='POST',
  ...     content_type='multipart/form-data; boundary=boundary',
  ...     accept='application/json',
  ...     POST={
  ...       'old': json.dumps([{'id': 'ok', 'sex': 'female'}]),
  ...       'new': json.dumps([{'id': 'ok', 'sex': 'male'}]),
  ...     }
  ... )
  >>> print(mutation(req)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  null

::

  >>> _ = port.delete([{'id': 'ok'}])
  >>> rex.off()

