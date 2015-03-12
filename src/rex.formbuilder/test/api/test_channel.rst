************
Channel APIs
************

.. contents:: Table of Contents


Set up the environment::

    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> from rex.formbuilder_demo import strip_cookies
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()


The ``/api/channel`` URI will accept GETs for listing::

    >>> req = Request.blank('/api/channel', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"uid": "entry", "title": "RexEntry"}, {"uid": "fake", "title": "FakeChannel"}, {"uid": "survey", "title": "RexSurvey"}]


The ``/api/channel`` URI will not accept POSTs, PUTs, or DELETEs::

    >>> req = Request.blank('/api/channel', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/channel', method='PUT', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/channel', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/api/channel/{uid}`` URI will accept GETs to retrieve an individual
Channel::

    >>> req = Request.blank('/api/channel/entry', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"uid": "entry", "title": "RexEntry"}

    >>> req = Request.blank('/api/channel/doesntexist', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/api/channel/{uid}`` URI will not accept POSTs, PUTs, or DELETEs::

    >>> req = Request.blank('/api/channel/123', method='POST', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/channel/123', method='PUT', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/channel/123', method='DELETE', remote_user='user1')
    >>> print strip_cookies(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...



    >>> rex.off()

