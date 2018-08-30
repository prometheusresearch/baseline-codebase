************
Channel APIs
************

.. contents:: Table of Contents


Set up the environment::

    >>> from webob import Request
    >>> from rex.core import Rex
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()


The ``/api/channel`` URI will accept GETs for listing::

    >>> req = Request.blank('/api/channel', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"uid": "entry", "presentation_type": "form", "title": "RexEntry"}, {"uid": "fake", "presentation_type": "form", "title": "FakeChannel"}, {"uid": "survey", "presentation_type": "form", "title": "RexSurvey"}]


The ``/api/channel`` URI will not accept POSTs, PUTs, or DELETEs::

    >>> req = Request.blank('/api/channel', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/channel', method='PUT', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/channel', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/api/channel/{uid}`` URI will accept GETs to retrieve an individual
Channel::

    >>> req = Request.blank('/api/channel/entry', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"uid": "entry", "presentation_type": "form", "title": "RexEntry"}

    >>> req = Request.blank('/api/channel/doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/api/channel/{uid}`` URI will not accept POSTs, PUTs, or DELETEs::

    >>> req = Request.blank('/api/channel/123', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/channel/123', method='PUT', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/channel/123', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...



    >>> rex.off()


