********************
Calculation Previews
********************

.. contents:: Table of Contents


Set up the environment::

    >>> from copy import deepcopy
    >>> from rex.core import Rex
    >>> from webob import Request
    >>> rex = Rex('rex.demo.forms')
    >>> rex.on()


Web API
=======

This package exposes a couple simple JSON APIs for invoking a task's
calculations::

    >>> ASSESSMENT = '{"instrument":{"id": "urn:test-calculation", "version": "1.1"}, "values": {"q_integer": {"value": 123}, "q_float": {"value": 12.3}, "age": {"value": "age30-49"}}}'

    >>> req = Request.blank('/calculate/instrument/calculation1', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 50
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{"calc1":135,"calc2":149,"calc3":true}}


    >>> req = Request.blank('/calculate/instrument/calculation1', remote_user='doesntexist', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

    >>> req = Request.blank('/calculate/instrument/calculation1', remote_user='user1', POST={'data': ASSESSMENT[:-1]})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...

    >>> req = Request.blank('/calculate/instrument/doesntexist', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> req = Request.blank('/calculate/instrument/simple1', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 14
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{}}

    >>> BAD_ASSESSMENT = '{"instrument":{"id": "urn:test-calculation", "version": "2.0"}, "values": {"q_integer": {"value": 123}, "q_float": {"value": 12.3}, "age": {"value": "age30-49"}}}'
    >>> req = Request.blank('/calculate/instrument/calculation1', remote_user='user1', POST={'data': BAD_ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...



    >>> req = Request.blank('/calculate/assessment/assessment9', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 50
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{"calc1":135,"calc2":149,"calc3":true}}


    >>> req = Request.blank('/calculate/assessment/assessment9', remote_user='doesntexist', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

    >>> req = Request.blank('/calculate/assessment/assessment9', remote_user='user1', POST={'data': ASSESSMENT[:-1]})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...

    >>> req = Request.blank('/calculate/assessment/doesntexist', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> req = Request.blank('/calculate/assessment/assessment1', remote_user='user1', POST={'data': ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: 14
    Set-Cookie: ...
    <BLANKLINE>
    {"results":{}}

    >>> BAD_ASSESSMENT = '{"instrument":{"id": "urn:test-calculation", "version": "2.0"}, "values": {"q_integer": {"value": 123}, "q_float": {"value": 12.3}, "age": {"value": "age30-49"}}}'
    >>> req = Request.blank('/calculate/assessment/assessment9', remote_user='user1', POST={'data': BAD_ASSESSMENT})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...


    >>> rex.off()


