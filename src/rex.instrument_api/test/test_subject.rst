***********
Subject API
***********

Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> rex = Rex('rex.instrument_api_demo')
    >>> rex.on()

    >>> def do_request(payload):
    ...     req = Request.blank('/subject', method='POST', remote_user='apiuser')
    ...     req.headers['Content-Type'] = 'application/json'
    ...     req.json = payload
    ...     return req.get_response(rex)


The Subject endpoint only accepts POSTs::

    >>> req = Request.blank('/subject', method='GET', remote_user='apiuser')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/subject', method='PUT', remote_user='apiuser')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/subject', method='DELETE', remote_user='apiuser')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


No parameters are required by default::

    >>> payload = {}
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: 29
    <BLANKLINE>
    {"subject": "fake_subject_1"}


If any context parameters are supplied, they will be validated against the
interface implementation and passed to the create() method::

    >>> payload['context'] = {'some_extra_parameter': 'foo'}
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 92
    <BLANKLINE>
    {"error": "Expected an integer\nGot:\n    'foo'\nWhile checking:\n    some_extra_parameter"}

    >>> payload['context']['some_extra_parameter'] = 123
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SUBJECT CREATE CONTEXT: {'some_extra_parameter': 123}
    201 Created
    Content-Type: application/json
    Content-Length: 29
    <BLANKLINE>
    {"subject": "fake_subject_1"}

