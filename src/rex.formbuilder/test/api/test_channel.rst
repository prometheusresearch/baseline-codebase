************
Channel APIs
************

.. contents:: Table of Contents


Set up the environment::

    >>> from webob import Request
    >>> from rex.core import Rex
    >>> rex = Rex('rex.form_builder_demo', db='pgsql:form_builder_demo', remote_user='demo')
    >>> rex.on()


The ``/api/channel`` URI will accept GETs for listing::

    >>> req = Request.blank('/formbuilder/api/channel', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"uid": "fake_channel_1", "title": "Title for fake_channel_1"}, {"uid": "fake_channel_2", "title": "Title for fake_channel_2"}]


The ``/api/channel`` URI will not accept POSTs, PUTs, or DELETEs::

    >>> req = Request.blank('/formbuilder/api/channel', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/channel', method='PUT', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/channel', method='DELETE', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/api/channel/{uid}`` URI will accept GETs to retrieve an individual
Channel::

    >>> req = Request.blank('/formbuilder/api/channel/123', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"uid": "123", "title": "Title for 123"}

    >>> req = Request.blank('/formbuilder/api/channel/doesntexist', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/api/channel/{uid}`` URI will not accept POSTs, PUTs, or DELETEs::

    >>> req = Request.blank('/formbuilder/api/channel/123', method='POST', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/channel/123', method='PUT', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/formbuilder/api/channel/123', method='DELETE', remote_user='test.testing')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...



    >>> rex.off()

