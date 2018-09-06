**********************
InstrumentVersion APIs
**********************

.. contents:: Table of Contents


Set up the environment::

    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()


The ``/instrumentversion`` URI will accept GETs for listing::

    >>> req = Request.blank('/api/instrumentversion', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 3672
    Set-Cookie: ...
    <BLANKLINE>
    [{"uid": "calculation1", "instrument": {"uid": "calculation", "title": "Calculation Instrument", "code": "calculation", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-06-09T00:00:00.000Z", "definition": {"id": "urn:test-calculation", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_integer", "type": "integer"}, {"id": "q_float", "type": "float"}, {"id": "age", "type": {"base": "enumeration", "enumerations": {"age30-49": {}, "age50-64": {}, "age65-and-over": {}, "age18-29": {}}}}]}}, {"uid": "calculation2", "instrument": {"uid": "calculation-complex", "title": "Calculation Instrument", "code": "calculation-complex", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-06-10T00:00:00.000Z", "definition": {"id": "urn:calculation-complex", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_integer", "type": "integer"}, {"id": "q_float", "type": "float"}, {"id": "q_text", "type": "text"}, {"id": "q_boolean", "type": "boolean"}, {"id": "q_date", "type": "date"}, {"id": "q_time", "type": "time"}, {"id": "q_enumeration", "type": {"base": "enumeration", "enumerations": {"myenum": {"description": "MyEnum!"}, "other": {"description": "Other!"}}}}, {"id": "q_enumerationset", "type": {"base": "enumerationSet", "enumerations": {"white": {"description": "White"}, "black": {"description": "Black"}, "red": {"description": "Red"}}}}, {"id": "q_recordlist", "type": {"base": "recordList", "record": [{"id": "hello", "type": "text"}, {"id": "goodbye", "type": "text"}]}}, {"id": "q_matrix", "type": {"base": "matrix", "columns": [{"id": "column1", "type": "integer"}, {"id": "column2", "type": "text"}], "rows": [{"id": "row1"}, {"id": "row2"}]}}]}}, {"uid": "complex1", "instrument": {"uid": "complex", "title": "Complex Instrument", "code": "complex", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-02T00:00:00.000Z", "definition": {"id": "urn:another-test-instrument", "version": "1.1", "title": "The Other Instrument", "record": [{"id": "q_foo", "type": "text"}, {"id": "q_bar", "type": "integer"}]}}, {"uid": "complex2", "instrument": {"uid": "complex", "title": "Complex Instrument", "code": "complex", "status": "active"}, "version": 2, "published_by": "someone", "date_published": "2015-01-03T00:00:00.000Z", "definition": {"id": "urn:another-test-instrument", "version": "1.2", "title": "The Other Instrument", "record": [{"id": "q_foo", "type": "text"}, {"id": "q_bar", "type": "integer"}, {"id": "q_baz", "type": "boolean"}]}}, {"uid": "disabled1", "instrument": {"uid": "disabled", "title": "Disabled Instrument", "code": "disabled", "status": "disabled"}, "version": 1, "published_by": "someone", "date_published": "2014-12-12T00:00:00.000Z", "definition": {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}}, {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z", "definition": {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}}, {"uid": "texter1", "instrument": {"uid": "texter", "title": "SMS Instrument", "code": "texter", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2014-12-12T00:00:00.000Z", "definition": {"id": "urn:texter", "version": "1.1", "title": "The SMS Instrument", "record": [{"id": "q_fake", "type": "text"}]}}]


The ``/instrumentversion`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/api/instrumentversion', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = b'{"instrument": "simple", "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}, "published_by": "someone"}'
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "fake_instrument_version_1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 2, "published_by": "someone", "date_published": "2014-05-22T00:00:00.000Z", "definition": {"record": [{"type": "text", "id": "baz"}], "version": "1.0", "id": "urn:new-instrument", "title": "My New Instrument"}}

    >>> req = Request.blank('/api/instrumentversion', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = b'{"definition": {}, "published_by": "someone"}'
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"error": "Missing required parameter: instrument"}


The ``/instrumentversion`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/instrumentversion', method='PUT', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrumentversion', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The ``/instrumentversion/{uid}`` URI will accept GETs to retrieve an individual
InstrumentVersion::

    >>> req = Request.blank('/api/instrumentversion/simple1', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z", "definition": {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}}

    >>> req = Request.blank('/api/instrumentversion/doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...


The ``/instrumentversion/{uid}`` URI will accept PUTs to update an
InstrumentVersion::

    >>> req = Request.blank('/api/instrumentversion/simple1', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = b'{"date_published": "2015-03-01T00:00:00.000Z"}'
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED INSTRUMENTVERSION simple1
    202 Accepted
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "user1", "date_published": "2015-03-01T00:00:00.000Z", "definition": {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}}


The ``/instrumentversion/{uid}`` URI will not accept POSTs or DELETEs::

    >>> req = Request.blank('/api/instrumentversion/123', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/instrumentversion/123', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The ``/instrumentversion/{uid}/draft`` will accept POSTs that will create
DraftInstrumentVersion and associated DraftForms for the specified
InstrumentVersion::

    >>> req = Request.blank('/api/instrumentversion/simple1/draft', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: ...
    <BLANKLINE>
    {"instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "user1", "date_created": "2014-05-22T00:00:00.000Z", "modified_by": "user1", "date_modified": "2014-05-22T00:00:00.000Z", "definition": {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}}, "forms": {"entry": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "entry", "title": "RexEntry", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How does the subject feel today?"}}}]}]}}, "survey": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}}}, "calculations_set": null}

    >>> req = Request.blank('/api/instrumentversion/complex2/draft', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: 2640
    Set-Cookie: ...
    <BLANKLINE>
    {"instrument_version": {"uid": "draftiv1", "instrument": {"uid": "complex", "title": "Complex Instrument", "code": "complex", "status": "active"}, "parent_instrument_version": {"uid": "complex2", "instrument": {"uid": "complex", "title": "Complex Instrument", "code": "complex", "status": "active"}, "version": 2, "published_by": "someone", "date_published": "2015-01-03T00:00:00.000Z"}, "created_by": "user1", "date_created": "2014-05-22T00:00:00.000Z", "modified_by": "user1", "date_modified": "2014-05-22T00:00:00.000Z", "definition": {"id": "urn:another-test-instrument", "version": "1.2", "title": "The Other Instrument", "record": [{"id": "q_foo", "type": "text"}, {"id": "q_bar", "type": "integer"}, {"id": "q_baz", "type": "boolean"}]}}, "forms": {"survey": {"uid": "fake_draftform_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "channel": {"uid": "survey", "title": "RexSurvey", "presentation_type": "form"}, "configuration": {"instrument": {"id": "urn:another-test-instrument", "version": "1.2"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_foo", "text": {"en": "How do you feel today?"}}}, {"type": "question", "options": {"fieldId": "q_bar", "text": {"en": "What is your favorite number?"}}}, {"type": "question", "options": {"fieldId": "q_baz", "text": {"en": "Is water wet?"}}}]}]}}}, "calculations_set": {"uid": "fake_draftcalculationset_1", "draft_instrument_version": {"uid": "draftiv1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "parent_instrument_version": {"uid": "simple1", "instrument": {"uid": "simple", "title": "Simple Instrument", "code": "simple", "status": "active"}, "version": 1, "published_by": "someone", "date_published": "2015-01-01T00:00:00.000Z"}, "created_by": "someone", "date_created": "2015-01-01T00:00:00.000Z", "modified_by": "someone", "date_modified": "2015-01-02T00:00:00.000Z"}, "definition": {"calculations": [{"id": "calc1", "method": "python", "options": {"expression": "1 + 2 + 3"}, "type": "integer"}], "instrument": {"id": "urn:another-test-instrument", "version": "1.2"}}}}

    >>> req = Request.blank('/api/instrumentversion/doesntexist/draft', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> req = Request.blank('/api/instrumentversion/draftiv2/draft', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...



    >>> rex.off()


