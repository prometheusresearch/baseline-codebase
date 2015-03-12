***************
Instrument APIs
***************

.. contents:: Table of Contents


Set up the environment::

    >>> import json
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> from rex.formbuilder_demo import strip_cookies
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()


The ``/instrument`` URI will accept GETs for listing::

    >>> req = Request.blank('/api/instrument', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"status": "active", "code": "complex", "uid": "complex", "title": "Complex Instrument"}, {"status": "disabled", "code": "disabled", "uid": "disabled", "title": "Disabled Instrument"}, {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}]


The ``/instrument`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/api/instrument', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"code": "something", "title": "my new instrument", "status": "disabled"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "disabled", "code": "something", "uid": "something", "title": "my new instrument"}

    >>> req = Request.blank('/api/instrument', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"title": "a broken instrument"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: code"}


The ``/instrument`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/instrument', method='PUT', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrument', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/instrument/{uid}`` URI will accept GETs to retrieve an individual
Instrument::

    >>> req = Request.blank('/api/instrument/simple', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}

    >>> req = Request.blank('/api/instrument/doesntexist', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/instrument/{uid}`` URI will accept PUTs to update an Instrument::

    >>> req = Request.blank('/api/instrument/simple', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"title": "A New Title!"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### SAVED INSTRUMENT simple
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "active", "code": "simple", "uid": "simple", "title": "A New Title!"}


The ``/instrument/{uid}`` URI will not accept POSTs or DELETEs::

    >>> req = Request.blank('/api/instrument/simple', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrument/simple', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/instrument/{uid}/version/latest`` URI will accept GETs to retrieve the
latest InstrumentVersion for the specified Instrument::

    >>> req = Request.blank('/api/instrument/simple/version/latest', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The InstrumentVersion Title"}, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1}

    >>> req = Request.blank('/api/instrument/doesntexist/version/latest', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    Content-Type: application/json; charset=UTF-8
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
    >>> req.body = json.dumps({'instrument': INSTRUMENT})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/api/instrument/validate', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "No Instrument Definition provided to validate"}

    >>> del INSTRUMENT['record']
    >>> req = Request.blank('/api/instrument/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument': INSTRUMENT})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "ERROR", "error": "u'record' is a required property"}


The ``/instrument/validate`` URI will not accept GETSs, PUTs or DELETEs::

    >>> req = Request.blank('/api/instrument/validate', method='GET', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrument/validate', method='PUT', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrument/validate', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...



    >>> rex.off()

