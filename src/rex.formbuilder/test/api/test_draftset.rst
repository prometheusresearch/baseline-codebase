*************
DraftSet APIs
*************

.. contents:: Table of Contents


Set up the environment::

    >>> from copy import deepcopy
    >>> import json
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


The ``/api/draftset`` URI will accept POSTs to create a new
DraftInstrumentVersion and its associated DraftForms::

    >>> payload = {
    ...     'instrument_version': {
    ...         'instrument': 'simple',
    ...         'created_by': 'someone',
    ...         'definition': {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}
    ...     },
    ...     'forms': {
    ...         'entry': {
    ...             'configuration': CONFIGURATION
    ...         },
    ...         'survey': {
    ...             'configuration': CONFIGURATION
    ...         }
    ...     }
    ... }

    >>> req = Request.blank('/api/draftset', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps(payload)
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"parent_instrument_version": null, "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}, "modified_by": "user1", "uid": "draftiv1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "user1", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2014-05-22T00:00:00.000Z"}, "forms": {"entry": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "entry", "title": "RexEntry"}}, "survey": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "survey", "title": "RexSurvey"}}}}


The ``/api/draftset/{uid}`` URI will accept GETs to retrieve the specified
DraftInstrumentVersion and its associated DraftForms::

    >>> req = Request.blank('/api/draftset/draftiv1', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The NEW InstrumentVersion Title"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "forms": {"entry": {"configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How does the Subject feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "draftform2", "channel": {"uid": "entry", "title": "RexEntry"}}, "survey": {"configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "draftform1", "channel": {"uid": "survey", "title": "RexSurvey"}}}}

    >>> req = Request.blank('/api/draftset/doesntexist', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/api/draftset/{uid}`` URI will accept PUTs to update the specified
DraftInstrumentVersion and its associated DraftForms::

    >>> new_form = deepcopy(CONFIGURATION)
    >>> new_form['pages'][0]['elements'][0]['options']['text']['en'] = 'New question text'
    >>> payload = {
    ...     'instrument_version': {
    ...         'definition': {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "NEWER InstrumentVersion Title"},
    ...     },
    ...     'forms': {
    ...         'entry': {'configuration': new_form},
    ...         'survey': {'configuration': CONFIGURATION},
    ...         'fake': {'configuration': CONFIGURATION}
    ...     }
    ... }
    >>> req = Request.blank('/api/draftset/draftiv1', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps(payload)
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### SAVED DRAFTINSTRUMENTVERSION draftiv1
    ### SAVED DRAFTFORM draftform1
    ### SAVED DRAFTFORM draftform2
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "NEWER InstrumentVersion Title"}, "modified_by": "user1", "uid": "draftiv1", "date_modified": "2014-05-22T12:34:56.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "forms": {"entry": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "New question text"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "draftform2", "channel": {"uid": "entry", "title": "RexEntry"}}, "survey": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "draftform1", "channel": {"uid": "survey", "title": "RexSurvey"}}, "fake": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "fake", "title": "FakeChannel"}}}}


The ``/api/draftset/{uid}`` URI will accept DELETEs to delete the specified
DraftInstrumentVersion and its associated DraftForms::

    >>> req = Request.blank('/api/draftset/draftiv1', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### DELETED DRAFTFORM draftform1
    ### DELETED DRAFTFORM draftform2
    ### DELETED DRAFTINSTRUMENTVERSION draftiv1
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0
    ...


The ``/api/draftset/{uid}`` URI will not accept POSTs::

    >>> req = Request.blank('/api/draftset/draftiv1', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/api/draftset/{uid}/publish`` URI will accept POSTs to execute
the publishing process on a DraftInstrumentVersion and its associated
DraftForms::

    >>> req = Request.blank('/api/draftset/draftiv1/publish', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS", "instrument_version": {"definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The NEW InstrumentVersion Title"}, "uid": "fake_published_draft_instrument_1", "date_published": "2014-05-22T00:00:00.000Z", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "user1", "version": 1}, "forms": {"entry": {"instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "user1", "version": 1, "uid": "fake_published_draft_instrument_1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How does the Subject feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "uid": "fake_form_1", "channel": {"uid": "entry", "title": "RexEntry"}}, "survey": {"instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "user1", "version": 1, "uid": "fake_published_draft_instrument_1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "uid": "fake_form_1", "channel": {"uid": "survey", "title": "RexSurvey"}}}}

    >>> req = Request.blank('/api/draftset/doesntexist/publish', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}


The ``/api/draftset/{uid}/clone`` URI will accept POSTs to make a copy of the
specified DraftInstrumentVersion and its associated DraftForms::

    >>> req = Request.blank('/api/draftset/draftiv1/clone', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: 2426
    <BLANKLINE>
    {"instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The NEW InstrumentVersion Title"}, "modified_by": "user1", "uid": "draftiv1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "user1", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2014-05-22T00:00:00.000Z"}, "forms": {"entry": {"configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How does the Subject feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "entry", "title": "RexEntry"}}, "survey": {"configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "survey", "title": "RexSurvey"}}}}


The ``/api/draftset/skeleton`` URI will accept POSTs to create a draftset that
contains no definitions/configurations::

    >>> req = Request.blank('/api/draftset/skeleton', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = '{"instrument": "simple", "channels": ["entry", "fake"]}'
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"parent_instrument_version": null, "definition": null, "modified_by": "user1", "uid": "draftiv1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "user1", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2014-05-22T00:00:00.000Z"}, "forms": {"entry": {"configuration": null, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "entry", "title": "RexEntry"}}, "fake": {"configuration": null, "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}, "uid": "fake_draftform_1", "channel": {"uid": "fake", "title": "FakeChannel"}}}}



    >>> rex.off()

