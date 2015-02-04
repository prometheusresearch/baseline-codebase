***************
Instrument APIs
***************

.. contents:: Table of Contents


Set up the environment::

    >>> import json
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> from rex.form_builder_demo import strip_cookies
    >>> rex = Rex('rex.form_builder_demo', db='pgsql:form_builder_demo')
    >>> rex.on()


The ``/instrument`` URI will accept GETs for listing::

    >>> req = Request.blank('/formbuilder/api/instrument', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"status": "active", "code": "fake_instrument_1", "uid": "fake_instrument_1", "title": "Title for fake_instrument_1"}, {"status": "active", "code": "fake_instrument_2", "uid": "fake_instrument_2", "title": "Title for fake_instrument_2"}]


The ``/instrument`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/formbuilder/api/instrument', method='POST', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"code": "something", "title": "my new instrument", "status": "disabled"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### CREATED INSTRUMENT
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "disabled", "code": "something", "uid": "something", "title": "my new instrument"}

    >>> req = Request.blank('/formbuilder/api/instrument', method='POST', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"title": "a broken instrument"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: code"}


The ``/instrument`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/instrument', method='PUT', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/instrument', method='DELETE', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/instrument/{uid}`` URI will accept GETs to retrieve an individual
Instrument::

    >>> req = Request.blank('/formbuilder/api/instrument/123', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "active", "code": "123", "uid": "123", "title": "Title for 123"}

    >>> req = Request.blank('/formbuilder/api/instrument/doesntexist', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/instrument/{uid}`` URI will accept PUTs to update an Instrument::

    >>> req = Request.blank('/formbuilder/api/instrument/123', method='PUT', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"title": "A New Title!"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### SAVED INSTRUMENT 123
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "active", "code": "123", "uid": "123", "title": "A New Title!"}


The ``/instrument/{uid}`` URI will not accept POSTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/instrument/123', method='POST', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/instrument/123', method='DELETE', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/instrument/{uid}/version/latest`` URI will accept GETs to retrieve the
latest InstrumentVersion for the specified Instrument::

    >>> req = Request.blank('/formbuilder/api/instrument/123/version/latest', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "uid": "fake_instrument_version_99", "date_published": "2014-05-22T00:00:00.000Z", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "someone", "version": 1}

    >>> req = Request.blank('/formbuilder/api/instrument/doesntexist/version/latest', remote_user='demo')
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

    >>> req = Request.blank('/formbuilder/api/instrument/validate', method='POST', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument': INSTRUMENT})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/formbuilder/api/instrument/validate', method='POST', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "No Instrument Definition provided to validate"}

    >>> del INSTRUMENT['record']
    >>> req = Request.blank('/formbuilder/api/instrument/validate', method='POST', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument': INSTRUMENT})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "ERROR", "error": "u'record' is a required property"}


The ``/instrument/validate`` URI will not accept GETSs, PUTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/instrument/validate', method='GET', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/instrument/validate', method='PUT', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/instrument/validate', method='DELETE', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...



    >>> rex.off()

