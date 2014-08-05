**************
SimpleResource
**************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.restful import SimpleResource
    >>> from webob import Request
    >>> from rex.core import Rex


Resource Methods
================

Set up the environment::

    >>> rex = Rex('rex.restful_demo')
    >>> rex.on()

When a GET request is issued against the ``base_path``, the ``list`` method is
invoked::

    >>> req = Request.blank('/baz')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### RETRIEVING BAZ LIST
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"baz": 1}, {"baz": 2}]

When a GET request is issued against the ``path``, the ``retrieve`` method is
invoked::

    >>> req = Request.blank('/baz/999')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### RETRIEVING BAZ 999
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"baz": "999"}

When a POST request is issued against the ``base_path``, the ``create`` method
is invoked::

    >>> req = Request.blank('/baz', method='POST')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATING BAZ
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"baz": "new"}

When a POST request is issued against the ``path`` a 405 is returned::

    >>> req = Request.blank('/baz/123', method='POST')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

When a PUT request is issued against the ``base_path`` a 405 is returned::

    >>> req = Request.blank('/baz', method='PUT')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

When a PUT request is issued against the ``path``, the ``update`` method is
invoked::

    >>> req = Request.blank('/baz/123', method='PUT')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### UPDATING BAZ 123
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"baz": "123"}

When a DELETE request is issued against the ``base_path`` a 405 is returned::

    >>> req = Request.blank('/baz', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

When a PUT request is issued against the ``path``, the ``delete`` method is
invoked::

    >>> req = Request.blank('/baz/123', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### DELETING BAZ 123
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0

