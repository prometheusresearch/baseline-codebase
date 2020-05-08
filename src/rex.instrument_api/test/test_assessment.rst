**************
Assessment API
**************

Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> rex = Rex('rex.instrument_api_demo')
    >>> rex.on()

    >>> def do_request(payload):
    ...     req = Request.blank('/assessment', method='POST', remote_user='apiuser')
    ...     req.headers['Content-Type'] = 'application/json'
    ...     req.json = payload
    ...     return req.get_response(rex)


The Assessment endpoint only accepts POSTs::

    >>> req = Request.blank('/assessment', method='GET', remote_user='apiuser')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/assessment', method='PUT', remote_user='apiuser')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/assessment', method='DELETE', remote_user='apiuser')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    405 Method Not Allowed
    ...


The subject must be specified, and must exist::

    >>> payload = {
    ...     'assessment': {
    ...         'values': {
    ...             'q_fake': {
    ...                 'value': 'foo',
    ...             },
    ...         },
    ...     },
    ... }

    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 91
    <BLANKLINE>
    {"error": "The incoming payload failed validation (Missing mandatory field:\n    subject)"}

    >>> payload['subject'] = 'doesntexist'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 53
    <BLANKLINE>
    {"error": "No Subject found for UID \"doesntexist\""}


The instrument_version can be specified, but must exist::

    >>> payload['subject'] = 'subject1'
    >>> payload['instrument_version'] = 'doesntexist'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 39
    <BLANKLINE>
    {"error": "Unknown Instrument Version"}

    >>> payload['instrument_version'] = 'apitest1'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 107
    <BLANKLINE>
    {"error": "The following problems were encountered when validating this Assessment:\ninstrument: Required"}


If instrument_version is not specified, we'll try to find it based on the
instrument reference embedded in the assessment::

    >>> del payload['instrument_version']
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 56
    <BLANKLINE>
    {"error": "Assessment has invalid Instrument Reference"}

    >>> payload['assessment']['instrument'] = {
    ...     'id': 'urn:some-instrument',
    ...     'version': '2.0',
    ... }
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 39
    <BLANKLINE>
    {"error": "Unknown Instrument Version"}

    >>> payload['assessment']['instrument']['id'] = 'urn:apitest'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 39
    <BLANKLINE>
    {"error": "Unknown Instrument Version"}

    >>> payload['assessment']['instrument']['version'] = '1.0'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED ASSESSMENT fake_assessment_1
    201 Created
    Content-Type: application/json
    Content-Length: 35
    <BLANKLINE>
    {"assessment": "fake_assessment_1"}


The Assessment must be well-formed::

    >>> payload2 = deepcopy(payload)
    >>> payload2['assessment']['values']['foo'] = {'value': 123}
    >>> print(do_request(payload2))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 123
    <BLANKLINE>
    {"error": "The following problems were encountered when validating this Assessment:\nvalues: Unknown field IDs found: foo"}


If given, the evaluation date must be a valid date::

    >>> payload['evaluation_date'] = 'foo'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 163
    <BLANKLINE>
    {"error": "The incoming payload failed validation (Expected a valid date in the format YYYY-MM-DD\nGot:\n    'foo'\nWhile validating field:\n    evaluation_date)"}

    >>> payload['evaluation_date'] = '2015-13-13'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 170
    <BLANKLINE>
    {"error": "The incoming payload failed validation (Expected a valid date in the format YYYY-MM-DD\nGot:\n    '2015-13-13'\nWhile validating field:\n    evaluation_date)"}

    >>> payload['evaluation_date'] = '2015-05-22'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED ASSESSMENT fake_assessment_1
    201 Created
    Content-Type: application/json
    Content-Length: 35
    <BLANKLINE>
    {"assessment": "fake_assessment_1"}


If any context parameters are supplied, they will be validated against the
interface implementation and passed to the create() method::

    >>> payload['context'] = {'foo': 'bar'}
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 57
    <BLANKLINE>
    {"error": "Unknown implementation context provided: foo"}

    >>> del payload['context']['foo']
    >>> payload['context']['some_extra_parameter'] = 'foo'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    Content-Type: application/json
    Content-Length: 92
    <BLANKLINE>
    {"error": "Expected an integer\nGot:\n    'foo'\nWhile checking:\n    some_extra_parameter"}

    >>> payload['context']['some_extra_parameter'] = 123
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### ASSESSMENT CREATE CONTEXT: {'some_extra_parameter': 123}
    ### SAVED ASSESSMENT fake_assessment_1
    201 Created
    Content-Type: application/json
    Content-Length: 35
    <BLANKLINE>
    {"assessment": "fake_assessment_1"}


If there are calculations associated with the InstrumentVersion, then they will
be executed and returned::

    >>> del payload['context']
    >>> payload['assessment']['instrument']['version'] = '1.1'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED ASSESSMENT fake_assessment_1
    ### SAVED ASSESSMENT fake_assessment_1
    ### CREATED RECORDSET fake_assessment_1 {'calc1': 'FOO'}
    201 Created
    Content-Type: application/json
    Content-Length: 69
    <BLANKLINE>
    {"assessment": "fake_assessment_1", "calculations": {"calc1": "FOO"}}


At one point, there was a bug where datetime strings in Assessments were being
mangled by rex.restful so that rex.instrument wouldn't see it as a valid
Assessment. This should now be fixed::

    >>> payload = {
    ...     'subject': 'subject1',
    ...     'assessment': {
    ...         'instrument': {
    ...             'id': 'urn:apitest2',
    ...             'version': '1.0',
    ...         },
    ...         'values': {
    ...             'q_fake': {
    ...                 'value': 'foo',
    ...             },
    ...             'q_datetime': {
    ...                 'value': '2011-02-03T12:34:56',
    ...             },
    ...         },
    ...     },
    ... }
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED ASSESSMENT fake_assessment_1
    201 Created
    Content-Type: application/json
    Content-Length: 35
    <BLANKLINE>
    {"assessment": "fake_assessment_1"}

    >>> payload['evaluation_date'] = '2015-05-22'
    >>> print(do_request(payload))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    ### SAVED ASSESSMENT fake_assessment_1
    201 Created
    Content-Type: application/json
    Content-Length: 35
    <BLANKLINE>
    {"assessment": "fake_assessment_1"}



    >>> rex.off()

