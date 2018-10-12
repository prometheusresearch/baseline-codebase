********
Commands
********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.core import Rex
    >>> from webob import Request
    >>> rex = Rex('rex.form_previewer_demo')


View Form
=========

The main Form View command responds with the following context variables::

    >>> req = Request.blank('/preview?form_id=draftform1', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    VIEWFORM
    USER: user1
    RETURN_URL: None
    CATEGORY: draft
    INSTRUMENT_VERSION: The NEW InstrumentVersion Title
    FORMS:
    entry: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How does the Subject feel today?'}}}]}]}
    survey: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How do you feel today?'}}}]}]}
    INITIAL_CHANNEL: survey
    CHANNELS: [{'uid': 'survey', 'title': 'RexSurvey', 'presentation_type': 'form'}, {'uid': 'entry', 'title': 'RexEntry', 'presentation_type': 'form'}]

    >>> req = Request.blank('/preview?form_id=draftform2', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    VIEWFORM
    USER: user1
    RETURN_URL: None
    CATEGORY: draft
    INSTRUMENT_VERSION: The NEW InstrumentVersion Title
    FORMS:
    entry: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How does the Subject feel today?'}}}]}]}
    survey: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How do you feel today?'}}}]}]}
    INITIAL_CHANNEL: entry
    CHANNELS: [{'uid': 'survey', 'title': 'RexSurvey', 'presentation_type': 'form'}, {'uid': 'entry', 'title': 'RexEntry', 'presentation_type': 'form'}]

    >>> req = Request.blank('/preview?instrument_id=draftiv1', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    VIEWFORM
    USER: user1
    RETURN_URL: None
    CATEGORY: draft
    INSTRUMENT_VERSION: The NEW InstrumentVersion Title
    FORMS:
    entry: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How does the Subject feel today?'}}}]}]}
    survey: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How do you feel today?'}}}]}]}
    INITIAL_CHANNEL: survey
    CHANNELS: [{'uid': 'survey', 'title': 'RexSurvey', 'presentation_type': 'form'}, {'uid': 'entry', 'title': 'RexEntry', 'presentation_type': 'form'}]

    >>> req = Request.blank('/preview?form_id=simple1entry&category=published', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    VIEWFORM
    USER: user1
    RETURN_URL: None
    CATEGORY: published
    INSTRUMENT_VERSION: The InstrumentVersion Title
    FORMS:
    entry: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How does the subject feel today?'}}}]}]}
    survey: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How do you feel today?'}}}]}]}
    INITIAL_CHANNEL: entry
    CHANNELS: [{'uid': 'entry', 'title': 'RexEntry', 'presentation_type': 'form'}, {'uid': 'survey', 'title': 'RexSurvey', 'presentation_type': 'form'}]

    >>> req = Request.blank('/preview?instrument_id=simple1&category=published', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    VIEWFORM
    USER: user1
    RETURN_URL: None
    CATEGORY: published
    INSTRUMENT_VERSION: The InstrumentVersion Title
    FORMS:
    entry: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How does the subject feel today?'}}}]}]}
    survey: {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'How do you feel today?'}}}]}]}
    INITIAL_CHANNEL: entry
    CHANNELS: [{'uid': 'entry', 'title': 'RexEntry', 'presentation_type': 'form'}, {'uid': 'survey', 'title': 'RexSurvey', 'presentation_type': 'form'}]


If you specify a DraftForm UID that doesn't exist, you get an error::

    >>> req = Request.blank('/preview?form_id=doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> req = Request.blank('/preview?form_id=doesntexist&category=published', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...


If you specify a DraftInstrumentVersion UID that doesn't exist, you get an
error::

    >>> req = Request.blank('/preview?instrument_id=doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> req = Request.blank('/preview?instrument_id=doesntexist&category=published', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...


If you don't specify either UID, you get an error::

    >>> req = Request.blank('/preview', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...


If you specify a bogus category, you get an error::

    >>> req = Request.blank('/preview?form_id=draftform1&category=foo', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...


If you specify a DraftInstrumentVersion that doesn't doesn't have any
associated DraftForms, you get an error::

    >>> req = Request.blank('/preview?instrument_id=draftiv2', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> req = Request.blank('/preview?instrument_id=disabled1&category=published', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...



Complete Form
=============

There is a Complete Form command that emulates the completion of form data
entry::

    >>> import json
    >>> ASSESSMENT = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1',
    ...     },
    ...     'values': {
    ...         'q_fake': {
    ...             'value': 'foo',
    ...         },
    ...     },
    ... }
    >>> req = Request.blank('/complete', remote_user='user1', POST={'instrument_id': 'draftiv1', 'category': 'draft', 'data': json.dumps(ASSESSMENT)})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"status": "SUCCESS", "results": {"uppercased": "FOO"}}

    >>> ASSESSMENT2 = {
    ...     'instrument': {
    ...         'id': 'urn:another-test-instrument',
    ...         'version': '1.2',
    ...     },
    ...     'values': {
    ...         'q_foo': {
    ...             'value': 'foo',
    ...         },
    ...         'q_bar': {
    ...             'value': 2,
    ...         },
    ...         'q_baz': {
    ...             'value': True,
    ...         },
    ...     },
    ... }
    >>> req = Request.blank('/complete', remote_user='user1', POST={'instrument_id': 'complex2', 'category': 'published', 'data': json.dumps(ASSESSMENT2)})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"status": "SUCCESS", "results": {"calc1": 6}}

    >>> ASSESSMENT2['instrument']['version'] = '1.1'
    >>> del ASSESSMENT2['values']['q_baz']
    >>> req = Request.blank('/complete', remote_user='user1', POST={'instrument_id': 'complex1', 'category': 'published', 'data': json.dumps(ASSESSMENT2)})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

If the calculations cause an exception, that message is returned to the
client::

    >>> ASSESSMENT['values']['q_fake']['value'] = None
    >>> req = Request.blank('/complete', remote_user='user1', POST={'instrument_id': 'draftiv1', 'category': 'draft', 'data': json.dumps(ASSESSMENT)})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"status": "ERROR", "message": "Unable to calculate expression assessment['q_fake'].upper(): 'NoneType' object has no attribute 'upper'\nWhile executing calculation:\n    uppercased"}

It complains if you give it a bad Assessment::

    >>> del ASSESSMENT2['values']
    >>> req = Request.blank('/complete', remote_user='user1', POST={'instrument_id': 'complex1', 'category': 'published', 'data': json.dumps(ASSESSMENT2)})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...

    >>> req = Request.blank('/complete', remote_user='user1', POST={'instrument_id': 'complex1', 'category': 'published', 'data': '{hello'})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...


Preview Calculations
====================

This package exposes a simple JSON API for invoking an Instruments's
calculations::

    >>> ASSESSMENT = '{"instrument":{"id": "urn:test-calculation", "version": "1.1"}, "values": {"q_integer": {"value": 123}, "q_float": {"value": 12.3}, "age": {"value": "age30-49"}}}'

    >>> req = Request.blank('/calculate/published/calculation1', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 50
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{"calc1":135,"calc2":149,"calc3":true}}


    >>> req = Request.blank('/calculate/published/calculation1', remote_user='doesntexist', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

    >>> req = Request.blank('/calculate/published/calculation1', remote_user='user1', POST={'data': ASSESSMENT[:-1]})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...

    >>> req = Request.blank('/calculate/published/doesntexist', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> req = Request.blank('/calculate/published/simple1', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 14
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{}}

    >>> BAD_ASSESSMENT = '{"instrument":{"id": "urn:test-calculation", "version": "2.0"}, "values": {"q_integer": {"value": 123}, "q_float": {"value": 12.3}, "age": {"value": "age30-49"}}}'
    >>> req = Request.blank('/calculate/published/calculation1', remote_user='user1', POST={'data': BAD_ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...


    >>> ASSESSMENT = '{"instrument":{"id": "urn:test-instrument", "version": "1.1"}, "values": {"q_fake": {"value": "foo?"}}}'

    >>> req = Request.blank('/calculate/draft/draftiv1', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 33
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{"uppercased":"FOO?"}}


    >>> req = Request.blank('/calculate/draft/draftiv1', remote_user='doesntexist', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

    >>> req = Request.blank('/calculate/draft/draftiv1', remote_user='user1', POST={'data': ASSESSMENT[:-1]})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...

    >>> req = Request.blank('/calculate/draft/doesntexist', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> req = Request.blank('/calculate/draft/draftiv2', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 14
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{}}

    >>> BAD_ASSESSMENT = '{"instrument":{"id": "urn:test-instrument", "version": "2.1"}, "values": {"q_fake": {"value": "foo?"}}}'
    >>> req = Request.blank('/calculate/draft/draftiv1', remote_user='user1', POST={'data': BAD_ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...


