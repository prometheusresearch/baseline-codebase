*********************
InstrumentVersion API
*********************

Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> rex = Rex('rex.instrument_api_demo')
    >>> rex.on()

    >>> def do_request(payload):
    ...     req = Request.blank('/instrumentversion', method='POST', remote_user='apiuser')
    ...     req.headers['Content-Type'] = 'application/json'
    ...     req.json = payload
    ...     return req.get_response(rex)


The Assessment endpoint only accepts POSTs::

    >>> req = Request.blank('/instrumentversion', method='GET', remote_user='apiuser')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/instrumentversion', method='PUT', remote_user='apiuser')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/instrumentversion', method='DELETE', remote_user='apiuser')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The instrument must be specified and valid::

    >>> payload = {}
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 94
    <BLANKLINE>
    {"error": "The incoming payload failed validation (Missing mandatory field:\n    instrument)"}

    >>> payload['instrument'] = {'foo': 'bar'}
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 143
    <BLANKLINE>
    {"error": "The following problems were encountered when validating this Instrument:\n<root>: Unrecognized keys in mapping: \"{'foo': 'bar'}\""}

    >>> payload['instrument'] = {
    ...     'id': 'urn:testing:some-test',
    ...     'version': '1.0',
    ...     'title': 'A Test Instrument',
    ...     'record': [
    ...         {
    ...             'id': 'field1',
    ...             'type': 'text',
    ...             'required': True,
    ...         },
    ...     ],
    ... }
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: 51
    <BLANKLINE>
    {"instrument_version": "fake_instrument_version_1"}


If calculationset is specified, it must be valid::

    >>> payload['calculationset'] = {'foo': 'bar'}
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 147
    <BLANKLINE>
    {"error": "The following problems were encountered when validating this CalculationSet:\n<root>: Unrecognized keys in mapping: \"{'foo': 'bar'}\""}

    >>> payload['calculationset'] = {
    ...     'instrument': {
    ...         'id': 'urn:testing:some-test',
    ...         'version': '1.0',
    ...     },
    ...     'calculations': [
    ...         {
    ...             'id': 'calc1',
    ...             'type': 'text',
    ...             'method': 'python',
    ...             'options': {
    ...                 'callable': 'my_module.some_function',
    ...             },
    ...         }
    ...     ]
    ... }
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 85
    <BLANKLINE>
    {"error": "Calculations using Python callables are not permitted via this interface"}

    >>> del payload['calculationset']['calculations'][0]['options']['callable']
    >>> payload['calculationset']['calculations'][0]['options']['expression'] = "assessment['field1'].upper()"
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: 51
    <BLANKLINE>
    {"instrument_version": "fake_instrument_version_1"}


If a base Instrument already exists, the new version must have an incremented
version::

    >>> payload['instrument']['id'] = 'urn:apitest'
    >>> payload['calculationset']['instrument']['id'] = 'urn:apitest'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 82
    <BLANKLINE>
    {"error": "The new version \"1.0\" is not newer than the current version \"1.1\""}

    >>> payload['instrument']['version'] = '2.0'
    >>> payload['calculationset']['instrument']['version'] = '2.0'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    201 Created
    Content-Type: application/json
    Content-Length: 51
    <BLANKLINE>
    {"instrument_version": "fake_instrument_version_1"}


If any context parameters are supplied, they will be validated against the
interface implementation and passed to the various create() methods::

    >>> payload['instrument']['id'] = 'urn:paramtest'
    >>> payload['calculationset']['instrument']['id'] = 'urn:paramtest'
    >>> payload['context'] = {
    ...     'param1': 'hello',
    ...     'param2': 'foo',
    ...     'param3': 'bar',
    ... }
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 80
    <BLANKLINE>
    {"error": "Expected an integer\nGot:\n    'hello'\nWhile checking:\n    param1"}

    >>> payload['context']['param1'] = 123
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### INSTRUMENT CREATE CONTEXT: {'param1': 123}
    400 Bad Request
    Content-Type: application/json
    Content-Length: 78
    <BLANKLINE>
    {"error": "Expected an integer\nGot:\n    'foo'\nWhile checking:\n    param2"}

    >>> payload['context']['param2'] = 456
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### INSTRUMENT CREATE CONTEXT: {'param1': 123}
    ### INSTRUMENTVERSION CREATE CONTEXT: {'param2': 456}
    400 Bad Request
    Content-Type: application/json
    Content-Length: 78
    <BLANKLINE>
    {"error": "Expected an integer\nGot:\n    'bar'\nWhile checking:\n    param3"}

    >>> payload['context']['param3'] = 789
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### INSTRUMENT CREATE CONTEXT: {'param1': 123}
    ### INSTRUMENTVERSION CREATE CONTEXT: {'param2': 456}
    ### CALCULATIONSET CREATE CONTEXT: {'param3': 789}
    201 Created
    Content-Type: application/json
    Content-Length: 51
    <BLANKLINE>
    {"instrument_version": "fake_instrument_version_1"}

