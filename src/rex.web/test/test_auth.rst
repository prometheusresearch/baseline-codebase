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
    ...     print(authenticate(anon_req))
    None

    >>> auth_req = Request.blank('/')
    >>> auth_req.remote_user = 'Alice'
    >>> with demo:
    ...     print(authenticate(auth_req))
    Alice

``authenticate()`` invokes the ``Authenticate`` interface and caches the
result as ``environ['rex.user']``.  Subsequent calls to ``authenticate()``
will return the cached value::

    >>> auth_req.environ['rex.user']
    'Alice'
    >>> auth_req.remote_user = 'Bob'
    >>> with demo:
    ...     print(authenticate(auth_req))
    Alice


``authorize()``
===============

Call ``authorize()`` to determine whether the request is granted a specific
permission.  There are three predefined permissions::

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

``authorize()`` also accepts a package name in place of a permission name.  In
this case, permission of the package defined using ``access`` setting is
assumed::

    >>> with Rex('rex.web_demo', access={'rex.web_demo': 'anybody'}):
    ...     print(authorize(anon_req, 'rex.web_demo'))
    True

    >>> with Rex('rex.web_demo', access={'rex.web_demo': 'nobody'}):
    ...     print(authorize(auth_req, 'rex.web_demo'))
    False

``authorize()`` invokes the ``Authorize`` interface and caches the result in
``environ['rex.access']`` dictionary.  Subsequent calls to ``authorize()`` will
return the cached value::

    >>> anon_req.environ['rex.access']['authenticated']
    False
    >>> anon_req.remote_user = 'Clarence'
    >>> authorize(anon_req, 'authenticated')
    False
    >>> demo.off()


``confine()``
=============

By implementing the ``Confine`` interface, you can define a context manager
that is activated when any handler is executed.  The context manager may depend
upon the incoming request and the permission of the handler.

Let us define a context manager that overrides the server name::

    >>> from rex.web import Confine
    >>> import contextlib

    >>> class ConfineQueryString(Confine):
    ...     priority = 'query-string'
    ...     access = 'anybody'
    ...     @contextlib.contextmanager
    ...     def __call__(self, req):
    ...         host = req.environ['HTTP_HOST']
    ...         req.environ['HTTP_HOST'] = 'localhost:8088'
    ...         yield
    ...         req.environ['HTTP_HOST'] = host

Now define a command that prints its URL::

    >>> from rex.web import Command
    >>> from webob import Response

    >>> class URLCommand(Command):
    ...     path = '/url'
    ...     access = 'anybody'
    ...     def render(self, req):
    ...         return Response(req.url, content_type='text/plain')

We can verify if the server name was actually overridden::

    >>> main = Rex('__main__', 'rex.web')
    >>> req = Request.blank('/url')
    >>> print(req.get_response(main))        # doctest: +ELLIPSIS
    200 OK
    ...
    http://localhost:8088/url



