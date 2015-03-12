**************
DraftForm APIs
**************

.. contents:: Table of Contents


Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> from rex.formbuilder_demo import strip_cookies
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()
    >>> CONFIGURATION = {
    ...     'instrument': {
    ...         'id': 'urn:some-instrument',
    ...         'version': '1.0',
    ...     },
    ...     'defaultLocalization': 'en',
    ...     'pages': [
    ...         {
    ...             'id': 'page1',
    ...             'elements': [
    ...                 {
    ...                     'type': 'question',
    ...                     'options': {
    ...                         'fieldId': 'foo',
    ...                         'text': {
    ...                             'en': 'What is your favorite foo?',
    ...                         },
    ...                     },
    ...                 },
    ...             ],
    ...         },
    ...     ],
    ... }


The ``/api/draftform`` URI will accept GETs for listing::

    >>> req = Request.blank('/api/draftform', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "draftform1", "channel": {"uid": "survey", "title": "RexSurvey"}}, {"configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How does the Subject feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "draftform2", "channel": {"uid": "entry", "title": "RexEntry"}}]


The ``/draft`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/api/draftform', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'entry', 'draft_instrument_version': 'draftiv1', 'configuration': CONFIGURATION})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "entry", "title": "RexEntry"}}

    >>> req = Request.blank('/api/draftform', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'entry', 'draft_instrument_version': 'draftiv1'})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"configuration": null, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "entry", "title": "RexEntry"}}


The ``/draftform`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/draftform', method='PUT', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/draftform', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftform/{uid}`` URI will accept GETs to retrieve an individual
DraftForm::

    >>> req = Request.blank('/api/draftform/draftform1', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "draftform1", "channel": {"uid": "survey", "title": "RexSurvey"}}

    >>> req = Request.blank('/api/draftform/doesntexist', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/draftform/{uid}`` URI will accept PUTs to update a DraftForm::

    >>> req = Request.blank('/api/draftform/draftform1', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> new_config = deepcopy(CONFIGURATION)
    >>> new_config['pages'][0]['elements'][0]['options']['text']['en'] = 'New question text'
    >>> req.body = json.dumps({'configuration': new_config})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### SAVED DRAFTFORM draftform1
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: 843
    <BLANKLINE>
    {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "New question text"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "draftform1", "channel": {"uid": "survey", "title": "RexSurvey"}}


The ``/draftform/{uid}`` URI will accept DELETEs to delete a
DraftForm::

    >>> req = Request.blank('/api/draftform/draftform1', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### DELETED DRAFTFORM draftform1
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0
    ...


The ``/draftform/{uid}`` URI will not accept POSTs::

    >>> req = Request.blank('/api/draftform/draftform1', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftform/{uid}/publish`` URI will accept POSTs to execute
the publishing process on a DraftForm::

    >>> req = Request.blank('/api/draftform/draftform1/publish', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument_version': 'simple1'})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS", "form": {"instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "uid": "fake_form_1", "channel": {"uid": "survey", "title": "RexSurvey"}}}

    >>> req = Request.blank('/api/draftform/draftform1/publish', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument_version': 'doesntexist'})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "doesntexist is not the UID of a valid InstrumentVersion"}

    >>> req = Request.blank('/api/draftform/draftform1/publish', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "No InstrumentVersion specified to publish against."}

    >>> req = Request.blank('/api/draftform/doesntexist/publish', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}



    >>> rex.off()

