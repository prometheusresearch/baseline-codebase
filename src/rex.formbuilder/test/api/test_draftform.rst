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
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    [{"uid": "draftform1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}}, {"uid": "draftform2", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How does the Subject feel today?"}}}]}]}}]


The ``/draft`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/api/draftform', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'entry', 'draft_instrument_version': 'draftiv1', 'configuration': CONFIGURATION}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "What is your favorite foo?"}}}]}]}}

    >>> req = Request.blank('/api/draftform', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'entry', 'draft_instrument_version': 'draftiv1'}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": null}


The ``/draftform`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/draftform', method='PUT', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/draftform', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The ``/draftform/{uid}`` URI will accept GETs to retrieve an individual
DraftForm::

    >>> req = Request.blank('/api/draftform/draftform1', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "draftform1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}}

    >>> req = Request.blank('/api/draftform/doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...


The ``/draftform/{uid}`` URI will accept PUTs to update a DraftForm::

    >>> req = Request.blank('/api/draftform/draftform1', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> new_config = deepcopy(CONFIGURATION)
    >>> new_config['pages'][0]['elements'][0]['options']['text']['en'] = 'New question text'
    >>> req.body = json.dumps({'configuration': new_config}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED DRAFTFORM draftform1
    202 Accepted
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "draftform1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "New question text"}}}]}]}}


The ``/draftform/{uid}`` URI will accept DELETEs to delete a
DraftForm::

    >>> req = Request.blank('/api/draftform/draftform1', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### DELETED DRAFTFORM draftform1
    204 No Content
    Content-Type: application/json
    Content-Length: 0
    ...


The ``/draftform/{uid}`` URI will not accept POSTs::

    >>> req = Request.blank('/api/draftform/draftform1', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The ``/draftform/{uid}/publish`` URI will accept POSTs to execute
the publishing process on a DraftForm::

    >>> req = Request.blank('/api/draftform/draftform1/publish', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument_version': 'simple1'}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS", "form": {"uid": "fake_form_1", "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}}}

    >>> req = Request.blank('/api/draftform/draftform1/publish', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument_version': 'doesntexist'}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "doesntexist is not the UID of a valid InstrumentVersion"}

    >>> req = Request.blank('/api/draftform/draftform1/publish', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "No InstrumentVersion specified to publish against."}

    >>> req = Request.blank('/api/draftform/doesntexist/publish', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}



    >>> rex.off()


