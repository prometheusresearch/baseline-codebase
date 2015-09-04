***************************
DraftInstrumentVersion APIs
***************************

.. contents:: Table of Contents


Set up the environment::

    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()


The ``/draftinstrumentversion`` URI will accept GETs for listing::

    >>> req = Request.blank('/api/draftinstrumentversion', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The NEW InstrumentVersion Title"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "A Different Title"}, "modified_by": "someone", "uid": "draftiv2", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}]


The ``/draftinstrumentversion`` URI will accept POSTs for creating new
instances::

    >>> req = Request.blank('/api/draftinstrumentversion', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"instrument": "simple", "parent_instrument_version": "simple1", "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}}'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}, "modified_by": "user1", "uid": "draftiv1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "user1", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2014-05-22T00:00:00.000Z"}

    >>> req = Request.blank('/api/draftinstrumentversion', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{}'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: instrument"}

    >>> req = Request.blank('/api/draftinstrumentversion', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"instrument": "simple", "created_by": "someone", "parent_instrument_version": "doesntexist"}'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "doesntexist is not the UID of a valid parent_instrument_version"}


The ``/draftinstrumentversion`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/draftinstrumentversion', method='PUT', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/draftinstrumentversion', method='DELETE', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftinstrumentversion/{uid}`` URI will accept GETs to retrieve an
individual DraftInstrumentVersion::

    >>> req = Request.blank('/api/draftinstrumentversion/draftiv1', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The NEW InstrumentVersion Title"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}

    >>> req = Request.blank('/api/draftinstrumentversion/doesntexist', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/draftinstrumentversion/{uid}`` URI will accept PUTs to update a
DraftInstrumentVersion::

    >>> req = Request.blank('/api/draftinstrumentversion/draftiv1', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "NEWER InstrumentVersion Title"}}'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### SAVED DRAFTINSTRUMENTVERSION draftiv1
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "NEWER InstrumentVersion Title"}, "modified_by": "user1", "uid": "draftiv1", "date_modified": "2014-05-22T12:34:56.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}


The ``/draftinstrumentversion/{uid}`` URI will accept DELETEs to delete a
DraftInstrumentVersion::

    >>> req = Request.blank('/api/draftinstrumentversion/draftiv1', method='DELETE', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### DELETED DRAFTINSTRUMENTVERSION draftiv1
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0
    ...


The ``/draftinstrumentversion/{uid}`` URI will not accept POSTs::

    >>> req = Request.blank('/api/draftinstrumentversion/draftiv1', method='POST', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftinstrumentversion/{uid}/publish`` URI will accept POSTs to execute
the publishing process on a DraftInstrumentVersion::

    >>> req = Request.blank('/api/draftinstrumentversion/draftiv1/publish', method='POST', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS", "instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "user1", "version": 1, "uid": "fake_published_draft_instrument_1", "date_published": "2014-05-22T00:00:00.000Z"}}

    >>> req = Request.blank('/api/draftinstrumentversion/doesntexist/publish', method='POST', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}



    >>> rex.off()

