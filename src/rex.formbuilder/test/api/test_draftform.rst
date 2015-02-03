**************
DraftForm APIs
**************

.. contents:: Table of Contents


Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> rex = Rex('rex.form_builder_demo', db='pgsql:form_builder_demo', remote_user='demo')
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

    >>> req = Request.blank('/formbuilder/api/draftform', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "fake_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "fake_draft_form_1", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}, {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "fake_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "fake_draft_form_2", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}]


The ``/draft`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/formbuilder/api/draftform', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'channel1', 'draft_instrument_version': 'iv1', 'configuration': CONFIGURATION})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATED DRAFTFORM
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "iv1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "new_draft_form_1", "channel": {"uid": "channel1", "title": "Title for channel1"}}

    >>> req = Request.blank('/formbuilder/api/draftform', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'channel1', 'draft_instrument_version': 'iv1'})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: configuration"}


The ``/draftform`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/draftform', method='PUT', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/draftform', method='DELETE', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftform/{uid}`` URI will accept GETs to retrieve an individual
DraftForm::

    >>> req = Request.blank('/formbuilder/api/draftform/123', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "fake_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "123", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}

    >>> req = Request.blank('/formbuilder/api/draftform/doesntexist', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/draftform/{uid}`` URI will accept PUTs to update a DraftForm::

    >>> req = Request.blank('/formbuilder/api/draftform/123', method='PUT', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> new_config = deepcopy(CONFIGURATION)
    >>> new_config['pages'][0]['elements'][0]['options']['text']['en'] = 'New question text'
    >>> req.body = json.dumps({'configuration': new_config})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### SAVED DRAFTFORM 123
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "New question text"}, "fieldId": "foo"}}], "id": "page1"}]}, "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "some_person", "uid": "fake_draft_instrument_version_1", "date_modified": "2014-05-22T00:00:00.000Z", "created_by": "some_person", "instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "date_created": "2014-05-22T00:00:00.000Z"}, "uid": "123", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}


The ``/draftform/{uid}`` URI will accept DELETEs to delete a
DraftForm::

    >>> req = Request.blank('/formbuilder/api/draftform/123', method='DELETE', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### DELETED DRAFTFORM 123
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0
    ...


The ``/draftform/{uid}`` URI will not accept POSTs::

    >>> req = Request.blank('/formbuilder/api/draftform/123', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftform/{uid}/publish`` URI will accept POSTs to execute
the publishing process on a DraftForm::

    >>> req = Request.blank('/formbuilder/api/draftform/123/publish', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument_version': '123'})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATED FORM
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS", "form": {"instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "someone", "version": 1, "uid": "123", "date_published": "2014-05-22T00:00:00.000Z"}, "uid": "new_form_1", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}}

    >>> req = Request.blank('/formbuilder/api/draftform/123/publish', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument_version': 'doesntexist'})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "doesntexist is not the UID of a valid InstrumentVersion"}

    >>> req = Request.blank('/formbuilder/api/draftform/123/publish', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "No InstrumentVersion specified to publish against."}

    >>> req = Request.blank('/formbuilder/api/draftform/doesntexist/publish', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}



    >>> rex.off()

