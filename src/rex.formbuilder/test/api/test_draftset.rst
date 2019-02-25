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
    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:some-instrument',
    ...         'version': '1.0',
    ...     },
    ...     'calculations': [
    ...         {
    ...             'id': 'calc1',
    ...             'type': 'text',
    ...             'method': 'python',
    ...             'options': {
    ...                 'expression': "assessment['baz'].upper",
    ...             },
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
    ...     },
    ...     'calculation_set': CALCULATIONSET,
    ... }

    >>> req = Request.blank('/api/draftset', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps(payload).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": null, "created_by": "user1", "date_created": "2014-05-22T00:00:00.000Z", "modified_by": "user1", "date_modified": "2014-05-22T00:00:00.000Z", "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}}, "forms": {"entry": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "What is your favorite foo?"}}}]}]}}, "survey": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "What is your favorite foo?"}}}]}]}}}, "calculation_set": {"uid": "fake_draftcalculationset_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "definition": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "calculations": [{"id": "calc1", "type": "text", "method": "python", "options": {"expression": "assessment['baz'].upper"}}]}}}


The ``/api/draftset/{uid}`` URI will accept GETs to retrieve the specified
DraftInstrumentVersion and its associated DraftForms::

    >>> req = Request.blank('/api/draftset/draftiv1', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z", "definition": {"id": "urn:test-instrument", "version": "1.1", "title": "The NEW InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}}, "forms": {"survey": {"uid": "draftform1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}}, "entry": {"uid": "draftform2", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How does the Subject feel today?"}}}]}]}}}, "calculation_set": {"uid": "draftiv1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "definition": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "uppercased", "type": "text", "method": "python", "options": {"expression": "assessment['q_fake'].upper()"}}]}}}

    >>> req = Request.blank('/api/draftset/doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    ...     },
    ...     'calculation_set': {
    ...         'definition': CALCULATIONSET,
    ...     },
    ... }
    >>> req = Request.blank('/api/draftset/draftiv1', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps(payload).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED DRAFTINSTRUMENTVERSION draftiv1
    ### SAVED DRAFTCALCULATIONSET draftiv1
    ### SAVED DRAFTFORM draftform1
    ### SAVED DRAFTFORM draftform2
    202 Accepted
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "user1", "date_modified": "2014-05-22T12:34:56.000Z", "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "NEWER InstrumentVersion Title"}}, "forms": {"survey": {"uid": "draftform1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "What is your favorite foo?"}}}]}]}}, "entry": {"uid": "draftform2", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "New question text"}}}]}]}}, "fake": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "fake", "title": "FakeChannel", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "What is your favorite foo?"}}}]}]}}}, "calculation_set": {"uid": "draftiv1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "definition": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "calculations": [{"id": "calc1", "type": "text", "method": "python", "options": {"expression": "assessment['baz'].upper"}}]}}}

    >>> req = Request.blank('/api/draftset/draftiv2', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps(payload).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED DRAFTINSTRUMENTVERSION draftiv2
    202 Accepted
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"uid": "draftiv2", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "user1", "date_modified": "2014-05-22T12:34:56.000Z", "definition": {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "NEWER InstrumentVersion Title"}}, "forms": {"entry": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv2", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "New question text"}}}]}]}}, "survey": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv2", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "What is your favorite foo?"}}}]}]}}, "fake": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv2", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "fake", "title": "FakeChannel", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "foo", "text": {"en": "What is your favorite foo?"}}}]}]}}}, "calculation_set": {"uid": "fake_draftcalculationset_1", "draft_instrument_version": {"uid": "draftiv2", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "definition": {"instrument": {"id": "urn:some-instrument", "version": "1.0"}, "calculations": [{"id": "calc1", "type": "text", "method": "python", "options": {"expression": "assessment['baz'].upper"}}]}}}


The ``/api/draftset/{uid}`` URI will accept DELETEs to delete the specified
DraftInstrumentVersion and its associated DraftForms::

    >>> req = Request.blank('/api/draftset/draftiv1', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### DELETED DRAFTFORM draftform1
    ### DELETED DRAFTFORM draftform2
    ### DELETED DRAFTCALCULATIONSET draftiv1
    ### DELETED DRAFTINSTRUMENTVERSION draftiv1
    204 No Content
    Content-Type: application/json
    Content-Length: 0
    ...


The ``/api/draftset/{uid}`` URI will not accept POSTs::

    >>> req = Request.blank('/api/draftset/draftiv1', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The ``/api/draftset/{uid}/publish`` URI will accept POSTs to execute
the publishing process on a DraftInstrumentVersion and its associated
DraftForms::

    >>> req = Request.blank('/api/draftset/draftiv1/publish', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS", "instrument_version": {"uid": "fake_published_draft_instrument_1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "user1", "date_published": "2014-05-22T00:00:00.000Z", "definition": {"id": "urn:test-instrument", "version": "1.1", "title": "The NEW InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}}, "forms": {"survey": {"uid": "fake_form_1", "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "instrument_version": {"uid": "fake_published_draft_instrument_1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "user1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}}, "entry": {"uid": "fake_form_1", "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "instrument_version": {"uid": "fake_published_draft_instrument_1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "user1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How does the Subject feel today?"}}}]}]}}}, "calculation_set": {"uid": "fake_calculationset_1", "instrument_version": {"uid": "fake_published_draft_instrument_1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "user1", "date_published": "2014-05-22T00:00:00.000Z"}, "definition": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "uppercased", "type": "text", "method": "python", "options": {"expression": "assessment['q_fake'].upper()"}}]}}}

    >>> req = Request.blank('/api/draftset/doesntexist/publish', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}


The ``/api/draftset/{uid}/clone`` URI will accept POSTs to make a copy of the
specified DraftInstrumentVersion and its associated DraftForms::

    >>> req = Request.blank('/api/draftset/draftiv1/clone', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "user1", "date_created": "2014-05-22T00:00:00.000Z", "modified_by": "user1", "date_modified": "2014-05-22T00:00:00.000Z", "definition": {"id": "urn:test-instrument", "version": "1.1", "title": "The NEW InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}}, "forms": {"survey": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}}, "entry": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How does the Subject feel today?"}}}]}]}}}, "calculation_set": {"uid": "fake_draftcalculationset_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "definition": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "uppercased", "type": "text", "method": "python", "options": {"expression": "assessment['q_fake'].upper()"}}]}}}


The ``/api/draftset/skeleton`` URI will accept POSTs to create a draftset that
contains no definitions/configurations::

    >>> req = Request.blank('/api/draftset/skeleton', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = b'{"instrument": "simple", "channels": ["entry", "fake"]}'
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": null, "created_by": "user1", "date_created": "2014-05-22T00:00:00.000Z", "modified_by": "user1", "date_modified": "2014-05-22T00:00:00.000Z", "definition": null}, "forms": {"entry": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": null}, "fake": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "fake", "title": "FakeChannel", "presentation_type": "form"}, "configuration": null}}, "calculation_set": null}



    >>> rex.off()


