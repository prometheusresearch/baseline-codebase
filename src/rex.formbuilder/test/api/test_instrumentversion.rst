**********************
InstrumentVersion APIs
**********************

.. contents:: Table of Contents


Set up the environment::

    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> from rex.formbuilder_demo import strip_cookies
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()


The ``/instrumentversion`` URI will accept GETs for listing::

    >>> req = Request.blank('/api/instrumentversion', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"definition": {"record": [{"type": "text", "id": "q_foo"}, {"type": "integer", "id": "q_bar"}], "version": "1.1", "id": "urn:another-test-instrument", "title": "The Other Instrument"}, "uid": "complex1", "date_published": "2015-01-02T00:00:00.000Z", "instrument": {"status": "active", "code": "complex", "uid": "complex", "title": "Complex Instrument"}, "published_by": "someone", "version": 1}, {"definition": {"record": [{"type": "text", "id": "q_foo"}, {"type": "integer", "id": "q_bar"}, {"type": "boolean", "id": "q_baz"}], "version": "1.2", "id": "urn:another-test-instrument", "title": "The Other Instrument"}, "uid": "complex2", "date_published": "2015-01-03T00:00:00.000Z", "instrument": {"status": "active", "code": "complex", "uid": "complex", "title": "Complex Instrument"}, "published_by": "someone", "version": 2}, {"definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The InstrumentVersion Title"}, "uid": "disabled1", "date_published": "2014-12-12T00:00:00.000Z", "instrument": {"status": "disabled", "code": "disabled", "uid": "disabled", "title": "Disabled Instrument"}, "published_by": "someone", "version": 1}, {"definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The InstrumentVersion Title"}, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1}, {"definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:texter", "title": "The SMS Instrument"}, "uid": "texter1", "date_published": "2014-12-12T00:00:00.000Z", "instrument": {"status": "active", "code": "texter", "uid": "texter", "title": "SMS Instrument"}, "published_by": "someone", "version": 1}]


The ``/instrumentversion`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/api/instrumentversion', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"instrument": "simple", "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}, "published_by": "someone"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}, "uid": "fake_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 2}

    >>> req = Request.blank('/api/instrumentversion', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"definition": {}, "published_by": "someone"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: instrument"}


The ``/instrumentversion`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/instrumentversion', method='PUT', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrumentversion', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/instrumentversion/{uid}`` URI will accept GETs to retrieve an individual
InstrumentVersion::

    >>> req = Request.blank('/api/instrumentversion/simple1', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The InstrumentVersion Title"}, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1}

    >>> req = Request.blank('/api/instrumentversion/doesntexist', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/instrumentversion/{uid}`` URI will accept PUTs to update an
InstrumentVersion::

    >>> req = Request.blank('/api/instrumentversion/simple1', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"date_published": "2015-03-01T00:00:00.000Z"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### SAVED INSTRUMENTVERSION simple1
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The InstrumentVersion Title"}, "uid": "simple1", "date_published": "2015-03-01T00:00:00.000Z", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "user1", "version": 1}


The ``/instrumentversion/{uid}`` URI will not accept POSTs or DELETEs::

    >>> req = Request.blank('/api/instrumentversion/123', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrumentversion/123', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/instrumentversion/{uid}/draft`` will accept POSTs that will create
DraftInstrumentVersion and associated DraftForms for the specified
InstrumentVersion::

    >>> req = Request.blank('/api/instrumentversion/simple1/draft', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The InstrumentVersion Title"}, "modified_by": "user1", "uid": "draftiv1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "user1", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2014-05-22T00:00:00.000Z"}, "forms": {"entry": {"configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How does the subject feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "entry", "presentation_type": "form", "title": "RexEntry"}}, "survey": {"configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "survey", "presentation_type": "form", "title": "RexSurvey"}}}}

    >>> req = Request.blank('/api/instrumentversion/doesntexist/draft', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/api/instrumentversion/draftiv2/draft', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...



    >>> rex.off()

