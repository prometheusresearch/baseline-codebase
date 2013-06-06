************************************
  Authentication and Authorization
************************************

.. contents:: Table of Contents


``authenticate()``
==================

Call ``authenticate()`` to find the user who submitted the request.  The
baseline implementation returns the value of CGI variable ``REMOTE_USER``::

    >>> from rex.core import Rex
    >>> from rex.web import authenticate, authorize
    >>> demo = Rex('rex.web_demo')

    >>> from webob import Request
    >>> anon_req = Request.blank('/')
    >>> with demo:
    ...     print authenticate(anon_req)
    None

    >>> auth_req = Request.blank('/')
    >>> auth_req.remote_user = 'Alice'
    >>> with demo:
    ...     print authenticate(auth_req)
    Alice

``authenticate()`` invokes the ``Authenticate`` interface and caches the
result as ``environ['rex.user']``.  Subsequent calls to ``authenticate()``
will return the cached value::

    >>> auth_req.environ['rex.user']
    'Alice'
    >>> auth_req.remote_user = 'Bob'
    >>> with demo:
    ...     print authenticate(auth_req)
    Alice


``authorize()``
===============

Call ``authorize()`` to determine whether the request is granted a specific permission.
There are three predefined permissions::

    >>> demo.on()
    >>> authorize(anon_req, 'anybody')
    True
    >>> authorize(anon_req, 'authenticated')
    False
    >>> authorize(anon_req, 'nobody')
    False
    >>> authorize(auth_req, 'anybody')
    True
    >>> authorize(auth_req, 'authenticated')
    True
    >>> authorize(auth_req, 'nobody')
    False
    >>> demo.off()

``authorize()`` invokes the ``Authorize`` interface and caches the
result in ``environ['rex.roles']`` dictionary.  Subsequent calls to ``authorize()``
will return the cached value::

    >>> anon_req.environ['rex.roles']['authenticated']
    False
    >>> anon_req.remote_user = 'Clarence'
    >>> authorize(anon_req, 'authenticated')
    False


