*********
Form APIs
*********

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


The ``/form`` URI will accept GETs for listing::

    >>> req = Request.blank('/formbuilder/api/form', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "someone", "version": 1, "uid": "fake_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "uid": "fake_form_1", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}, {"instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "someone", "version": 1, "uid": "fake_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "uid": "fake_form_2", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}]


The ``/form`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/formbuilder/api/form', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'channel1', 'instrument_version': 'iv1', 'configuration': CONFIGURATION})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATED FORM
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "someone", "version": 1, "uid": "iv1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "uid": "new_form_1", "channel": {"uid": "channel1", "title": "Title for channel1"}}

    >>> req = Request.blank('/formbuilder/api/form', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'channel1', 'instrument_version': 'iv1'})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: configuration"}


The ``/form`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/form', method='PUT', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/form', method='DELETE', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/form/{uid}`` URI will accept GETs to retrieve an individual
Form::

    >>> req = Request.blank('/formbuilder/api/form/123', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "someone", "version": 1, "uid": "fake_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "foo"}}], "id": "page1"}]}, "uid": "123", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}

    >>> req = Request.blank('/formbuilder/api/form/doesntexist', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/form/{uid}`` URI will accept PUTs to update a Form::

    >>> req = Request.blank('/formbuilder/api/form/123', method='PUT', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> new_config = deepcopy(CONFIGURATION)
    >>> new_config['pages'][0]['elements'][0]['options']['text']['en'] = 'New question text'
    >>> req.body = json.dumps({'configuration': new_config})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### SAVED FORM 123
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"instrument": {"status": "active", "code": "fake_instrument_1iv", "uid": "fake_instrument_1iv", "title": "Title for fake_instrument_1iv"}, "published_by": "someone", "version": 1, "uid": "fake_instrument_version_1", "date_published": "2014-05-22T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "New question text"}, "fieldId": "foo"}}], "id": "page1"}]}, "uid": "123", "channel": {"uid": "fake_channel_1", "title": "Title for fake_channel_1"}}


The ``/form/{uid}`` URI will not accept POSTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/form/123', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/form/123', method='DELETE', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/form/validate`` URI will accept POSTs to validate the structure of
a Form Configuration::

    >>> req = Request.blank('/formbuilder/api/form/validate', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/formbuilder/api/form/validate', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION, 'instrument_version': '123'})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/formbuilder/api/form/validate', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION, 'instrument_definition': {'id': 'urn:some-instrument', 'version': '1.0', 'title': 'Some Fake Instrument', 'record': [{'id': 'foo', 'type': 'text'}]}})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/formbuilder/api/form/validate', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION, 'instrument_version': 'doesntexist'})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "doesntexist is not the UID of a valid InstrumentVersion"}

    >>> req = Request.blank('/formbuilder/api/form/validate', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "No Form Configuration provided to validate"}

    >>> del CONFIGURATION['pages']
    >>> req = Request.blank('/formbuilder/api/form/validate', method='POST', remote_user='test.testing')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION})
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "ERROR", "error": "u'pages' is a required property"}


The ``/form/validate`` URI will not accept GETSs, PUTs or DELETEs::

    >>> req = Request.blank('/formbuilder/api/form/validate', method='GET', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/form/validate', method='PUT', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/form/validate', method='DELETE', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...



    >>> rex.off()

