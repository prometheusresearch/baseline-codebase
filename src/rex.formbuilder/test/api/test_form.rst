*********
Form APIs
*********

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
    ...                         'fieldId': 'q_fake',
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

    >>> req = Request.blank('/api/form', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"instrument_version": {"instrument": {"status": "active", "code": "complex", "uid": "complex", "title": "Complex Instrument"}, "published_by": "someone", "version": 1, "uid": "complex1", "date_published": "2015-01-02T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.1", "id": "urn:another-test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_foo"}}, {"type": "question", "options": {"text": {"en": "What is your favorite number?"}, "fieldId": "q_bar"}}], "id": "page1"}]}, "uid": "complex1survey", "channel": {"uid": "survey", "title": "RexSurvey"}}, {"instrument_version": {"instrument": {"status": "active", "code": "complex", "uid": "complex", "title": "Complex Instrument"}, "published_by": "someone", "version": 2, "uid": "complex2", "date_published": "2015-01-03T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.2", "id": "urn:another-test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_foo"}}, {"type": "question", "options": {"text": {"en": "What is your favorite number?"}, "fieldId": "q_bar"}}, {"type": "question", "options": {"text": {"en": "Is water wet?"}, "fieldId": "q_baz"}}], "id": "page1"}]}, "uid": "complex2survey", "channel": {"uid": "survey", "title": "RexSurvey"}}, {"instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How does the subject feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "uid": "simple1entry", "channel": {"uid": "entry", "title": "RexEntry"}}, {"instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "uid": "simple1survey", "channel": {"uid": "survey", "title": "RexSurvey"}}]


The ``/form`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/api/form', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'entry', 'instrument_version': 'simple1', 'configuration': CONFIGURATION})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "What is your favorite foo?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "uid": "fake_form_1", "channel": {"uid": "entry", "title": "RexEntry"}}

    >>> req = Request.blank('/api/form', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'entry', 'instrument_version': 'simple1'})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: configuration"}


The ``/form`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/form', method='PUT', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/form', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/form/{uid}`` URI will accept GETs to retrieve an individual
Form::

    >>> req = Request.blank('/api/form/simple1entry', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How does the subject feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "uid": "simple1entry", "channel": {"uid": "entry", "title": "RexEntry"}}

    >>> req = Request.blank('/api/form/doesntexist', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/form/{uid}`` URI will accept PUTs to update a Form::

    >>> req = Request.blank('/api/form/simple1entry', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> new_config = deepcopy(CONFIGURATION)
    >>> new_config['pages'][0]['elements'][0]['options']['text']['en'] = 'New question text'
    >>> req.body = json.dumps({'configuration': new_config})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    ### SAVED FORM simple1entry
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"version": "1.0", "id": "urn:some-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "New question text"}, "fieldId": "q_fake"}}], "id": "page1"}]}, "uid": "simple1entry", "channel": {"uid": "entry", "title": "RexEntry"}}


The ``/form/{uid}`` URI will not accept POSTs or DELETEs::

    >>> req = Request.blank('/api/form/simple1entry', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/form/simple1entry', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/form/validate`` URI will accept POSTs to validate the structure of
a Form Configuration::

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION, 'instrument_version': 'simple1'})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION, 'instrument_definition': {'id': 'urn:some-instrument', 'version': '1.0', 'title': 'Some Fake Instrument', 'record': [{'id': 'q_fake', 'type': 'text'}]}})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION, 'instrument_version': 'doesntexist'})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "doesntexist is not the UID of a valid InstrumentVersion"}

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "No Form Configuration provided to validate"}

    >>> del CONFIGURATION['pages']
    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION})
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "ERROR", "error": "u'pages' is a required property"}


The ``/form/validate`` URI will not accept GETSs, PUTs or DELETEs::

    >>> req = Request.blank('/api/form/validate', method='GET', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/form/validate', method='PUT', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/form/validate', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...



    >>> rex.off()

