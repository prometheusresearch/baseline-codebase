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
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
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
    entry: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How does the Subject feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    survey: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How do you feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    INITIAL_CHANNEL: survey
    CHANNELS: [{'uid': u'survey', 'presentation_type': u'form', 'title': u'RexSurvey'}, {'uid': u'entry', 'presentation_type': u'form', 'title': u'RexEntry'}]

    >>> req = Request.blank('/preview?form_id=draftform2', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
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
    entry: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How does the Subject feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    survey: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How do you feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    INITIAL_CHANNEL: entry
    CHANNELS: [{'uid': u'survey', 'presentation_type': u'form', 'title': u'RexSurvey'}, {'uid': u'entry', 'presentation_type': u'form', 'title': u'RexEntry'}]

    >>> req = Request.blank('/preview?instrument_id=draftiv1', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
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
    entry: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How does the Subject feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    survey: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How do you feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    INITIAL_CHANNEL: survey
    CHANNELS: [{'uid': u'survey', 'presentation_type': u'form', 'title': u'RexSurvey'}, {'uid': u'entry', 'presentation_type': u'form', 'title': u'RexEntry'}]

    >>> req = Request.blank('/preview?form_id=simple1entry&category=published', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
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
    entry: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How does the subject feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    survey: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How do you feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    INITIAL_CHANNEL: entry
    CHANNELS: [{'uid': u'entry', 'presentation_type': u'form', 'title': u'RexEntry'}, {'uid': u'survey', 'presentation_type': u'form', 'title': u'RexSurvey'}]

    >>> req = Request.blank('/preview?instrument_id=simple1&category=published', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
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
    entry: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How does the subject feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    survey: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How do you feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    INITIAL_CHANNEL: entry
    CHANNELS: [{'uid': u'entry', 'presentation_type': u'form', 'title': u'RexEntry'}, {'uid': u'survey', 'presentation_type': u'form', 'title': u'RexSurvey'}]


If you specify a DraftForm UID that doesn't exist, you get an error::

    >>> req = Request.blank('/preview?form_id=doesntexist', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/preview?form_id=doesntexist&category=published', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


If you specify a DraftInstrumentVersion UID that doesn't exist, you get an
error::

    >>> req = Request.blank('/preview?instrument_id=doesntexist', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/preview?instrument_id=doesntexist&category=published', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


If you don't specify either UID, you get an error::

    >>> req = Request.blank('/preview', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


If you specify a bogus category, you get an error::

    >>> req = Request.blank('/preview?form_id=draftform1&category=foo', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...


If you specify a DraftInstrumentVersion that doesn't doesn't have any
associated DraftForms, you get an error::

    >>> req = Request.blank('/preview?instrument_id=draftiv2', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/preview?instrument_id=disabled1&category=published', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
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
    >>> req = Request.blank('/complete', remote_user='user1', method='POST')
    >>> req.POST['instrument_id'] = 'draftiv1'
    >>> req.POST['category'] = 'draft'
    >>> req.POST['data'] = json.dumps(ASSESSMENT)
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
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
    >>> req = Request.blank('/complete', remote_user='user1', method='POST')
    >>> req.POST['instrument_id'] = 'complex2'
    >>> req.POST['category'] = 'published'
    >>> req.POST['data'] = json.dumps(ASSESSMENT2)
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"status": "SUCCESS", "results": {"calc1": 6}}

    >>> ASSESSMENT2['instrument']['version'] = '1.1'
    >>> del ASSESSMENT2['values']['q_baz']
    >>> req = Request.blank('/complete', remote_user='user1', method='POST')
    >>> req.POST['instrument_id'] = 'complex1'
    >>> req.POST['category'] = 'published'
    >>> req.POST['data'] = json.dumps(ASSESSMENT2)
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"status": "SUCCESS"}

If the calculations cause an exception, that message is returned to the
client::

    >>> ASSESSMENT['values']['q_fake']['value'] = None
    >>> req = Request.blank('/complete', remote_user='user1', method='POST')
    >>> req.POST['instrument_id'] = 'draftiv1'
    >>> req.POST['category'] = 'draft'
    >>> req.POST['data'] = json.dumps(ASSESSMENT)
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"status": "ERROR", "message": "Unable to calculate expression assessment['q_fake'].upper(): 'NoneType' object has no attribute 'upper'"}

It complains if you give it a bad Assessment::

    >>> del ASSESSMENT2['values']
    >>> req = Request.blank('/complete', remote_user='user1', method='POST')
    >>> req.POST['instrument_id'] = 'complex1'
    >>> req.POST['category'] = 'published'
    >>> req.POST['data'] = json.dumps(ASSESSMENT2)
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...

    >>> req = Request.blank('/complete', remote_user='user1', method='POST')
    >>> req.POST['instrument_id'] = 'complex1'
    >>> req.POST['category'] = 'published'
    >>> req.POST['data'] = '{hello'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...


Preview Calculations
====================

This package exposes a simple JSON API for invoking an Instruments's
calculations::

    >>> ASSESSMENT = '{"instrument":{"id": "urn:test-calculation", "version": "1.1"}, "values": {"q_integer": {"value": 123}, "q_float": {"value": 12.3}, "age": {"value": "age30-49"}}}'

    >>> req = Request.blank('/calculate/published/calculation1', remote_user='user1', method='POST')
    >>> req.POST['data'] = ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 50
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{"calc1":135,"calc2":149,"calc3":true}}


    >>> req = Request.blank('/calculate/published/calculation1', remote_user='doesntexist', method='POST')
    >>> req.POST['data'] = ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank('/calculate/published/calculation1', remote_user='user1', method='POST')
    >>> req.POST['data'] = ASSESSMENT[:-1]
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...

    >>> req = Request.blank('/calculate/published/doesntexist', remote_user='user1', method='POST')
    >>> req.POST['data'] = ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/calculate/published/simple1', remote_user='user1', method='POST')
    >>> req.POST['data'] = ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 14
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{}}

    >>> req = Request.blank('/calculate/published/calculation1', remote_user='user1', method='POST')
    >>> BAD_ASSESSMENT = '{"instrument":{"id": "urn:test-calculation", "version": "2.0"}, "values": {"q_integer": {"value": 123}, "q_float": {"value": 12.3}, "age": {"value": "age30-49"}}}'
    >>> req.POST['data'] = BAD_ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...


    >>> ASSESSMENT = '{"instrument":{"id": "urn:test-instrument", "version": "1.1"}, "values": {"q_fake": {"value": "foo?"}}}'

    >>> req = Request.blank('/calculate/draft/draftiv1', remote_user='user1', method='POST')
    >>> req.POST['data'] = ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 33
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{"uppercased":"FOO?"}}


    >>> req = Request.blank('/calculate/draft/draftiv1', remote_user='doesntexist', method='POST')
    >>> req.POST['data'] = ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank('/calculate/draft/draftiv1', remote_user='user1', method='POST')
    >>> req.POST['data'] = ASSESSMENT[:-1]
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...

    >>> req = Request.blank('/calculate/draft/doesntexist', remote_user='user1', method='POST')
    >>> req.POST['data'] = ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/calculate/draft/draftiv2', remote_user='user1', method='POST')
    >>> req.POST['data'] = ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 14
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{}}

    >>> req = Request.blank('/calculate/draft/draftiv1', remote_user='user1', method='POST')
    >>> BAD_ASSESSMENT = '{"instrument":{"id": "urn:test-instrument", "version": "2.1"}, "values": {"q_fake": {"value": "foo?"}}}'
    >>> req.POST['data'] = BAD_ASSESSMENT
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...

