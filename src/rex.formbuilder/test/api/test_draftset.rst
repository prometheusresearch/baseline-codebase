*************
DraftSet APIs
*************

.. contents:: Table of Contents


Set up the environment::

    >>> from copy import deepcopy
    >>> import json
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> rex = Rex('rex.formbuilder_demo', db='pgsql:formbuilder_demo')
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
    ...         'instrument': 'inst1',
    ...         'created_by': 'someone',
    ...         'definition': {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}
    ...     },
    ...     'forms': {
    ...         'chan1': {
    ...             'configuration': CONFIGURATION
    ...         },
    ...         'chan2': {
    ...             'configuration': CONFIGURATION
    ...         }
    ...     }
    ... }

    >>> req = Request.blank('/api/draftset', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps(payload)
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATED DRAFTINSTRUMENTVERSION
    ### CREATED DRAFTFORM
    ### CREATED DRAFTFORM
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"instrument_version": {"parent_instrument_version": null, "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}, "modified_by": "someone", "uid": "new_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "inst1", "uid": "inst1", "title": "Title for inst1"}, "date_created": "2014-05-22T00:00:00.000Z"}, "forms": {"chan1": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "new_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "new_draft_form_1", "channel": {"uid": "chan1", "title": "Title for chan1"}}, "chan2": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "new_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "new_draft_form_1", "channel": {"uid": "chan2", "title": "Title for chan2"}}}}


The ``/api/draftset/{uid}`` URI will accept GETs to retrieve the specified
DraftInstrumentVersion and its associated DraftForms::

    >>> req = Request.blank('/api/draftset/123', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"instrument_version": {"parent_instrument_version": null, "definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "modified_by": "some_person", "uid": "123", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "forms": {"fake_channel_1": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "fake_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "fake_draft_form_1", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}, "fake_channel_2": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "fake_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "fake_draft_form_2", "channel": {"uid": "fake_channel_2", "title": "Title for fake_channel_2"}}}}

    >>> req = Request.blank('/api/draftset/doesntexist', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/api/draftset/{uid}`` URI will accept PUTs to update the specified
DraftInstrumentVersion and its associated DraftForms::

    >>> new_form = deepcopy(CONFIGURATION)
    >>> new_form['pages'][0]['elements'][0]['options']['text']['en'] = 'New question text'
    >>> payload = {
    ...     'instrument_version': {
    ...         'modified_by': 'someone else',
    ...     },
    ...     'forms': {
    ...         'fake_channel_1': {'configuration': new_form},
    ...         'fake_channel_2': {'configuration': CONFIGURATION}
    ...     }
    ... }
    >>> req = Request.blank('/api/draftset/123', method='PUT', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps(payload)
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### SAVED DRAFTINSTRUMENTVERSION 123
    ### SAVED DRAFTFORM fake_draft_form_1
    ### SAVED DRAFTFORM fake_draft_form_2
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"instrument_version": {"parent_instrument_version": null, "definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "modified_by": "someone else", "uid": "123", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "forms": {"fake_channel_1": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "New question text"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "fake_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "fake_draft_form_1", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}, "fake_channel_2": {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "fake_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "fake_draft_form_2", "channel": {"uid": "fake_channel_2", "title": "Title for fake_channel_2"}}}}

    >>> payload2 = deepcopy(payload)
    >>> del payload2['forms']['fake_channel_2']
    >>> req = Request.blank('/api/draftset/123', method='PUT', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps(payload2)
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"error": "Missing some DraftForms (fake_channel_2)"}


The ``/api/draftset/{uid}`` URI will accept DELETEs to delete the specified
DraftInstrumentVersion and its associated DraftForms::

    >>> req = Request.blank('/api/draftset/123', method='DELETE', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### DELETED DRAFTFORM fake_draft_form_1
    ### DELETED DRAFTFORM fake_draft_form_2
    ### DELETED DRAFTINSTRUMENTVERSION 123
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0
    ...


The ``/api/draftset/{uid}`` URI will not accept POSTs::

    >>> req = Request.blank('/api/draftset/123', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/api/draftset/{uid}/publish`` URI will accept POSTs to execute
the publishing process on a DraftInstrumentVersion and its associated
DraftForms::

    >>> req = Request.blank('/api/draftset/123/publish', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATED INSTRUMENTVERSION
    ### CREATED FORM
    ### CREATED FORM
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"status": "SUCCESS", "instrument_version": {"definition": {"record": [{"type": "text", "id": "foo"}], "version": "1.0", "id": "urn:some-instrument", "title": "Some Fake Instrument"}, "uid": "new_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "test.testing", "version": 1}, "forms": {"fake_channel_1": {"instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "test.testing", "version": 1, "uid": "new_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "uid": "new_form_1", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}, "fake_channel_2": {"instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "test.testing", "version": 1, "uid": "new_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "uid": "new_form_1", "channel": {"uid": "fake_channel_2", "title": "Title for fake_channel_2"}}}}

    >>> req = Request.blank('/api/draftset/doesntexist/publish', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}



    >>> rex.off()

