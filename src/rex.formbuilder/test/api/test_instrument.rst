***************
Instrument APIs
***************

.. contents:: Table of Contents


Set up the environment::

    >>> import json
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()


The ``/instrument`` URI will accept GETs for listing::

    >>> req = Request.blank('/api/instrument', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 576
    Set-Cookie: ...
    <BLANKLINE>
    [{"uid": "calculation", "title": "Calculation Instrument", "code": "calculation", "status": "active"}, {"uid": "calculation-complex", "title": "Calculation Instrument", "code": "calculation-complex", "status": "active"}, {"uid": "complex", "title": "Complex Instrument", "code": "complex", "status": "active"}, {"uid": "disabled", "title": "Disabled Instrument", "code": "disabled", "status": "disabled"}, {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, {"uid": "texter", "title": "SMS Instrument", "code": "texter", "status": "active"}]


The ``/instrument`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/api/instrument', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = b'{"code": "something", "title": "my new instrument", "status": "disabled"}'
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "something", "title": "my new instrument", "code": "something", "status": "disabled"}

    >>> req = Request.blank('/api/instrument', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = b'{"title": "a broken instrument"}'
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: code"}


The ``/instrument`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/instrument', method='PUT', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrument', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The ``/instrument/{uid}`` URI will accept GETs to retrieve an individual
Instrument::

    >>> req = Request.blank('/api/instrument/simple', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}

    >>> req = Request.blank('/api/instrument/doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...


The ``/instrument/{uid}`` URI will accept PUTs to update an Instrument::

    >>> req = Request.blank('/api/instrument/simple', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = b'{"title": "A New Title!"}'
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED INSTRUMENT simple
    202 Accepted
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "simple", "title": "A New Title!", "code": "simple", "status": "active"}


The ``/instrument/{uid}`` URI will not accept POSTs or DELETEs::

    >>> req = Request.blank('/api/instrument/simple', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrument/simple', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The ``/instrument/{uid}/version/latest`` URI will accept GETs to retrieve the
latest InstrumentVersion for the specified Instrument::

    >>> req = Request.blank('/api/instrument/simple/version/latest', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z", "definition": {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}}

    >>> req = Request.blank('/api/instrument/doesntexist/version/latest', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}


The ``/instrument/validate`` URI will accept POSTs to validate the structure of
an Instrument Definition::

    >>> INSTRUMENT = {
    ...     'id': 'urn:some-instrument',
    ...     'version': '1.0',
    ...     'title': 'Some Cool Instrument',
    ...     'record': [
    ...         {
    ...             'id': 'foo',
    ...             'type': 'text',
    ...         },
    ...     ],
    ... }

    >>> req = Request.blank('/api/instrument/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument': INSTRUMENT}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/api/instrument/validate', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "No Instrument Definition provided to validate"}

    >>> del INSTRUMENT['record']
    >>> req = Request.blank('/api/instrument/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument': INSTRUMENT}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"status": "ERROR", "error": "The following problems were encountered when validating this Instrument:\nrecord: Required"}


The ``/instrument/validate`` URI will not accept GETSs, PUTs or DELETEs::

    >>> req = Request.blank('/api/instrument/validate', method='GET', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrument/validate', method='PUT', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrument/validate', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...



    >>> rex.off()


