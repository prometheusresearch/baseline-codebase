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
    ...     role = 'anybody'
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
    Content-Length: 149
    Content-Type: text/plain; charset=UTF-8
    <BLANKLINE>
    400 Bad Request
    <BLANKLINE>
    The server could not comply with the request since it is either malformed or otherwise incorrect.
    <BLANKLINE>
    Found unknown parameter:
        mood

Missing mandatory parameters are reported::

    >>> req = Request.blank('/hello')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    400 Bad Request
    ...
    Cannot find parameter:
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
    ...     role = 'anybody'
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


Authentication
==============

Attribute ``Command.role`` specifies the role required to perform the command.
If not set, *authenticated* role is assumed::

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

If ``Command.role`` is set to ``None``, authorization is not performed.  This
has the same effect as setting ``Command.role`` to ``'anybody'``::

    >>> class PublicCommand(Command):
    ...     path = '/public'
    ...     role = None     # or 'anybody'
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


