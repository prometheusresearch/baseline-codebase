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
    INSTRUMENT_VERSION: The NEW InstrumentVersion Title
    FORMS:
    entry: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How does the Subject feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    survey: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How do you feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    INITIAL_CHANNEL: survey
    CHANNELS: [{'uid': u'survey', 'title': u'RexSurvey'}, {'uid': u'entry', 'title': u'RexEntry'}]

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
    INSTRUMENT_VERSION: The NEW InstrumentVersion Title
    FORMS:
    entry: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How does the Subject feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    survey: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How do you feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    INITIAL_CHANNEL: entry
    CHANNELS: [{'uid': u'survey', 'title': u'RexSurvey'}, {'uid': u'entry', 'title': u'RexEntry'}]

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
    INSTRUMENT_VERSION: The NEW InstrumentVersion Title
    FORMS:
    entry: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How does the Subject feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    survey: {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'en': 'How do you feel today?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}]}
    INITIAL_CHANNEL: survey
    CHANNELS: [{'uid': u'survey', 'title': u'RexSurvey'}, {'uid': u'entry', 'title': u'RexEntry'}]


If you specify a DraftForm UID that doesn't exist, you get an error::

    >>> req = Request.blank('/preview?form_id=doesntexist', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


If you specify a DraftInstrumentVersion UID that doesn't exist, you get an
error::

    >>> req = Request.blank('/preview?instrument_id=doesntexist', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


If you specify a DraftInstrumentVersion that doesn't doesn't have any
associated DraftForms, you get an error::

    >>> req = Request.blank('/preview?instrument_id=draftiv2', remote_user='user1')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...

