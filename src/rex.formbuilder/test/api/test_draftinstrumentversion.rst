***************************
DraftInstrumentVersion APIs
***************************

.. contents:: Table of Contents


Set up the environment::

    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> from rex.form_builder_demo import strip_cookies
    >>> rex = Rex('rex.form_builder_demo', db='pgsql:form_builder_demo')
    >>> rex.on()


The ``/draftinstrumentversion`` URI will accept GETs for listing::

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"parent_instrument_version": null, "definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "modified_by": "some_person", "uid": "fake_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1div", "uid": "fake_instrument_1div", "title": "Title for fake_instrument_1div"}, "date_created": "2014-05-22T00:00:00.000Z"}, {"parent_instrument_version": null, "definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "modified_by": "some_person", "uid": "fake_draft_instrument_version_2", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_2div", "uid": "fake_instrument_2div", "title": "Title for fake_instrument_2div"}, "date_created": "2014-05-22T00:00:00.000Z"}]


The ``/draftinstrumentversion`` URI will accept POSTs for creating new
instances::

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion', method='POST', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"instrument": "inst1", "created_by": "someone", "parent_instrument_version": "instver2", "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### CREATED DRAFTINSTRUMENTVERSION
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"parent_instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "someone", "version": 1, "uid": "instver2", "date_published": "2014-05-22T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}, "modified_by": "someone", "uid": "new_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "inst1", "uid": "inst1", "title": "Title for inst1"}, "date_created": "2014-05-22T00:00:00.000Z"}

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion', method='POST', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"instrument": "inst1"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: created_by"}

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion', method='POST', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"instrument": "inst1", "created_by": "someone", "parent_instrument_version": "doesntexist"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "doesntexist is not the UID of a valid parent_instrument_version"}


The ``/draftinstrumentversion`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion', method='PUT', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion', method='DELETE', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftinstrumentversion/{uid}`` URI will accept GETs to retrieve an
individual DraftInstrumentVersion::

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion/123', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"parent_instrument_version": null, "definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "modified_by": "some_person", "uid": "123", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion/doesntexist', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/draftinstrumentversion/{uid}`` URI will accept PUTs to update a
DraftInstrumentVersion::

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion/123', method='PUT', remote_user='demo')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"modified_by": "someone else"}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### SAVED DRAFTINSTRUMENTVERSION 123
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"parent_instrument_version": null, "definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "modified_by": "someone else", "uid": "123", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}


The ``/draftinstrumentversion/{uid}`` URI will accept DELETEs to delete a
DraftInstrumentVersion::

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion/123', method='DELETE', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### DELETED DRAFTINSTRUMENTVERSION 123
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0
    ...


The ``/draftinstrumentversion/{uid}`` URI will not accept POSTs::

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion/123', method='POST', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftinstrumentversion/{uid}/publish`` URI will accept POSTs to execute
the publishing process on a DraftInstrumentVersion::

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion/123/publish', method='POST', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### CREATED INSTRUMENTVERSION
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS", "instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "demo", "version": 1, "uid": "new_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z"}}

    >>> req = Request.blank('/formbuilder/api/draftinstrumentversion/doesntexist/publish', method='POST', remote_user='demo')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}



    >>> rex.off()

