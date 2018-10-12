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
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()
    >>> CONFIGURATION = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1',
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
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    [{"uid": "complex1survey", "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "instrument_version": {"uid": "complex1", "instrument": {"uid": "complex", "title": "Complex Instrument", "code": "complex", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-02T00:00:00.000Z"}, "configuration": {"instrument": {"id": "urn:another-test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_foo", "text": {"en": "How do you feel today?"}}}, {"type": "question", "options": {"fieldId": "q_bar", "text": {"en": "What is your favorite number?"}}}]}]}}, {"uid": "complex2survey", "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "instrument_version": {"uid": "complex2", "instrument": {"uid": "complex", "title": "Complex Instrument", "code": "complex", "status": "active"}, "version": 2, "published_by": "someone", "date_published": "2015-01-03T00:00:00.000Z"}, "configuration": {"instrument": {"id": "urn:another-test-instrument", "version": "1.2"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_foo", "text": {"en": "How do you feel today?"}}}, {"type": "question", "options": {"fieldId": "q_bar", "text": {"en": "What is your favorite number?"}}}, {"type": "question", "options": {"fieldId": "q_baz", "text": {"en": "Is water wet?"}}}]}]}}, {"uid": "simple1entry", "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How does the subject feel today?"}}}]}]}}, {"uid": "simple1survey", "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}}]


The ``/form`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/api/form', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'entry', 'instrument_version': 'simple1', 'configuration': CONFIGURATION}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "fake_form_1", "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "What is your favorite foo?"}}}]}]}}

    >>> req = Request.blank('/api/form', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'channel': 'entry', 'instrument_version': 'simple1'}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: configuration"}


The ``/form`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/form', method='PUT', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/form', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The ``/form/{uid}`` URI will accept GETs to retrieve an individual
Form::

    >>> req = Request.blank('/api/form/simple1entry', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "simple1entry", "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How does the subject feel today?"}}}]}]}}

    >>> req = Request.blank('/api/form/doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...


The ``/form/{uid}`` URI will accept PUTs to update a Form::

    >>> req = Request.blank('/api/form/simple1entry', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> new_config = deepcopy(CONFIGURATION)
    >>> new_config['pages'][0]['elements'][0]['options']['text']['en'] = 'New question text'
    >>> req.body = json.dumps({'configuration': new_config}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED FORM simple1entry
    202 Accepted
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "simple1entry", "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "New question text"}}}]}]}}


The ``/form/{uid}`` URI will not accept POSTs or DELETEs::

    >>> req = Request.blank('/api/form/simple1entry', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/form/simple1entry', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The ``/form/validate`` URI will accept POSTs to validate the structure of
a Form Configuration::

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION, 'instrument_version': 'simple1'}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION, 'instrument_definition': {'id': 'urn:test-instrument', 'version': '1.1', 'title': 'Some Fake Instrument', 'record': [{'id': 'q_fake', 'type': 'text'}]}}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION, 'instrument_version': 'doesntexist'}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "doesntexist is not the UID of a valid InstrumentVersion"}

    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "No Form Configuration provided to validate"}

    >>> del CONFIGURATION['pages']
    >>> req = Request.blank('/api/form/validate', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'form': CONFIGURATION}).encode('utf-8')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"status": "ERROR", "error": "The following problems were encountered when validating this Form:\npages: Required"}


The ``/form/validate`` URI will not accept GETSs, PUTs or DELETEs::

    >>> req = Request.blank('/api/form/validate', method='GET', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/form/validate', method='PUT', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/form/validate', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...



    >>> rex.off()


