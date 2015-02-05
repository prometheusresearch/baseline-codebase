**********************
InstrumentVersion APIs
**********************

.. contents:: Table of Contents


Set up the environment::

    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> from rex.form_builder_demo import strip_cookies
    >>> rex = Rex('rex.form_builder_demo', db='pgsql:form_builder_demo')
    >>> rex.on()


The ``/instrumentversion`` URI will accept GETs for listing::

    >>> req = Request.blank('/formbuilder/api/instrumentversion', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "uid": "fake_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "some_person", "version": 1}, {"definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "uid": "fake_instrument_version_2", "date_published": "2014-05-22T00:00:00.000Z", "instrument": {"status": "active", "code": "fake_instrument_2iv", "uid": "fake_instrument_2iv", "title": "Title for fake_instrument_2iv"}, "published_by": "some_person", "version": "2"}]


The ``/instrumentversion`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/formbuilder/api/instrumentversion', method='POST', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"instrument": "inst1", "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}, "published_by": "someone"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### CREATED INSTRUMENTVERSION
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}, "uid": "new_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z", "instrument": {"status": "active", "code": "inst1", "uid": "inst1", "title": "Title for inst1"}, "published_by": "someone", "version": 1}

    >>> req = Request.blank('/formbuilder/api/instrumentversion', method='POST', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"definition": {}, "published_by": "someone"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: instrument"}


The ``/instrumentversion`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/instrumentversion', method='PUT', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/instrumentversion', method='DELETE', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/instrumentversion/{uid}`` URI will accept GETs to retrieve an individual
InstrumentVersion::

    >>> req = Request.blank('/formbuilder/api/instrumentversion/123', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "uid": "123", "date_published": "2014-05-22T00:00:00.000Z", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "someone", "version": 1}

    >>> req = Request.blank('/formbuilder/api/instrumentversion/doesntexist', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/instrumentversion/{uid}`` URI will accept PUTs to update an
InstrumentVersion::

    >>> req = Request.blank('/formbuilder/api/instrumentversion/123', method='PUT', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### SAVED INSTRUMENTVERSION 123
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "uid": "123", "date_published": "2014-05-22T00:00:00.000Z", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "demo", "version": 1}


The ``/instrumentversion/{uid}`` URI will not accept POSTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/instrumentversion/123', method='POST', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/instrumentversion/123', method='DELETE', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...



    >>> rex.off()

