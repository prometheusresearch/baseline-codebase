************
  Commands
************

.. contents:: Table of Contents


``Command``
===========

``Command`` is a specialized variant of ``HandleLocation`` with built-in
support for authorization and parsing query parameters::

    >>> from rex.core import Rex, StrVal, ChoiceVal
    >>> from rex.web import Command, Parameter
    >>> from webob import Request, Response

    >>> class HelloCommand(Command):
    ...     path = '/hello'
    ...     access = 'anybody'
    ...     parameters = [
    ...         Parameter('greeting', ChoiceVal('Hello', 'Hi', 'Howdy'), 'Hello'),
    ...         Parameter('name', StrVal()),
    ...     ]
    ...
    ...     def render(self, req, greeting, name):
    ...         return Response("%s, %s!" % (greeting, name),
    ...                         content_type='text/plain')

    >>> demo = Rex('__main__', 'rex.web')
    >>> req = Request.blank('/hello?name=Alice')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 13
    <BLANKLINE>
    Hello, Alice!


Parsing parameters
==================

Attribute ``Command.parameters`` describes expected query parameters::

    >>> HelloCommand.parameters     # doctest: +NORMALIZE_WHITESPACE
    [Parameter('greeting', validate=ChoiceVal('Hello', 'Hi', 'Howdy'), default='Hello'),
     Parameter('name', validate=StrVal())]

The parameters are extracted, validated and passed to the ``render()`` method
as keyword arguments::

    >>> req = Request.blank('/hello?greeting=Hi&name=Bob')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 8
    <BLANKLINE>
    Hi, Bob!

Unknown parameters are rejected::

    >>> req = Request.blank('/hello?name=Carl&mood=somber')
    >>> print req.get_response(demo)
    400 Bad Request
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 106
    <BLANKLINE>
    The server cannot understand the request due to malformed syntax.
    <BLANKLINE>
    Received unexpected parameter:
        mood

Missing mandatory parameters are reported::

    >>> req = Request.blank('/hello')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    400 Bad Request
    ...
    Cannot find parameter:
        name

Multiple values for singular parameters are rejected too::

    >>> req = Request.blank('/hello?name=Alice&name=Bob&name=Carl')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    400 Bad Request
    ...
    Got multiple values for a parameter:
        name

Ill-formed parameters are detected::

    >>> req = Request.blank('/hello?greeting=Good%20morning&name=Daniel')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    400 Bad Request
    ...
    Expected one of:
        Hello, Hi, Howdy
    Got:
        u'Good morning'
    While parsing parameter:
        greeting

Errors are rendered in ``text/plain`` or ``text/html``::

    >>> req.accept = 'text/html'
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    400 Bad Request
    ...
    Expected one of:<br />
    <pre>Hello, Hi, Howdy</pre><br />
    Got:<br />
    <pre>u'Good morning'</pre><br />
    While parsing parameter:<br />
    <pre>greeting</pre>
    ...

Set attribute ``Command.parameters`` to ``None`` to disable parsing
parameters::

    >>> class NoParsingCommand(Command):
    ...     path = '/no-parsing'
    ...     access = 'anybody'
    ...     parameters = None
    ...
    ...     def render(self, req):
    ...         return Response("We can parse our parameters ourselves,"
    ...                         " thank you very much!",
    ...                         content_type='text/plain')

    >>> demo.cache.clear()      # reset WSGI stack
    >>> req = Request.blank('/no-parsing?param=value')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 59
    <BLANKLINE>
    We can parse our parameters ourselves, thank you very much!

To permit multiple values for a parameter, turn on the ``many`` flag on the
parameter.  In this case, the values are passed as a list::

    >>> class HelloManyCommand(Command):
    ...     path = '/hello_many'
    ...     access = 'anybody'
    ...     parameters = [
    ...         Parameter('names', StrVal(), many=True),
    ...     ]
    ...
    ...     def render(self, req, names):
    ...         name_list = ", ".join(names[:-1])
    ...         if name_list:
    ...             name_list = "%s and %s" % (name_list, names[-1])
    ...         else:
    ...             name_list = names[-1]
    ...         return Response("Hello, %s!" % name_list,
    ...                         content_type='text/plain')

    >>> HelloManyCommand.parameters
    [Parameter('names', validate=StrVal(), many=True)]

    >>> demo.cache.clear()      # reset WSGI stack
    >>> req = Request.blank('/hello_many?names=Alice&names=Bob&names=Carl')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 27
    <BLANKLINE>
    Hello, Alice, Bob and Carl!


Authentication
==============

Attribute ``Command.access`` specifies the permission required to perform the
command.  If not set, *authenticated* is assumed::

    >>> from rex.web import authenticate

    >>> class ProtectedCommand(Command):
    ...     path = '/protected'
    ...
    ...     def render(self, req):
    ...         return Response("Hello, %s!" % authenticate(req),
    ...                         content_type='text/plain')

    >>> demo.cache.clear()
    >>> req = Request.blank('/protected')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank('/protected')
    >>> req.remote_user = 'Alice'
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 13
    <BLANKLINE>
    Hello, Alice!

If ``Command.access`` is set to ``None``, authorization is not performed.  This
has the same effect as setting ``Command.access`` to ``'anybody'``::

    >>> class PublicCommand(Command):
    ...     path = '/public'
    ...     access = None   # or 'anybody'
    ...
    ...     def render(self, req):
    ...         return Response("Hello, stranger!", content_type='text/plain')

    >>> demo.cache.clear()
    >>> req = Request.blank('/public')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 16
    <BLANKLINE>
    Hello, stranger!


Checking new implementations
============================

``Command`` requires you to always override the ``render()`` method::

    >>> class BrokenCommand(Command):
    ...     path = '/broken'
    ...
    ...     def __call__(self, req):
    ...         return Response("Have you defined the `render()` method?",
    ...                         content_type='text/plain')
    Traceback (most recent call last):
      ...
    AssertionError: abstract method __main__.BrokenCommand.render()


CSRF protection
===============

A command which can only be executed by a trusted page is called "unsafe".
Such commands expect a CSRF token passed either via HTTP headers or via
form parameters::

    >>> from rex.core import Rex
    >>> from webob import Request

    >>> csrf = Rex('rex.web_demo', './test/data/csrf/')
    >>> req = Request.blank('/unsafe')
    >>> print req.get_response(csrf)        # doctest: +ELLIPSIS
    403 Forbidden
    ...

To perform an unsafe command, we must associate a CSRF token with the user
session::

    >>> import re
    >>> req = Request.blank('/csrf/index.html')
    >>> resp = req.get_response(csrf)
    >>> session_cookie = resp.headers['Set-Cookie'].split('=')[1].split(';')[0]
    >>> csrf_token = re.search('<meta name="_csrf_token" content="([^"]*)">', str(resp)).group(1)

To execute the command, we must submit the value of the CSRF token with the
request::

    >>> req = Request.blank('/unsafe')
    >>> req.cookies['rex.session'] = session_cookie
    >>> req.headers['X-CSRF-Token'] = csrf_token
    >>> print req.get_response(csrf)        # doctest: +ELLIPSIS
    200 OK
    ...

We could also submit the token as a form parameter::

    >>> req = Request.blank('/unsafe')
    >>> req.cookies['rex.session'] = session_cookie
    >>> req.method = 'POST'
    >>> req.body = '_csrf_token='+csrf_token
    >>> print req.get_response(csrf)        # doctest: +ELLIPSIS
    200 OK
    ...

If the token values do not match, the request is rejected::

    >>> req = Request.blank('/unsafe')
    >>> req.cookies['rex.session'] = session_cookie
    >>> req.headers['X-CSRF-Token'] = csrf_token[::-1]
    >>> print req.get_response(csrf)        # doctest: +ELLIPSIS
    403 Forbidden
    ...


