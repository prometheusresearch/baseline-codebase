Passing URLs to widgets
=======================

Sometimes it is useful to pass resolved URLs or even better resolved URLs to
ports and query to JavaScript.

Prerequisite
============

::

  >>> from webob import Request, Response

  >>> from rex.core import Rex
  >>> from rex.web import Command, Parameter
  >>> from rex.widget import encode

  >>> from rex.widget import URLVal, URL, PortURL, QueryURL

URL
===

``URLVal`` is used to pass resolved URLs to JavaScript::

  >>> validate = URLVal()

  >>> url = validate("sandbox:/")
  >>> url
  URL(route='sandbox:/', params=None)

  >>> validate(url)
  URL(route='sandbox:/', params=None)

Resulted ``URL`` objects can be called with WSGI request as argument to return a
resolved variant of the URL::

  >>> class RenderURL(Command):
  ...   path = '/url'
  ...   access = 'anybody'
  ...   parameters = (Parameter('url', validate),)
  ... 
  ...   def render(self, req, url):
  ...     return Response(encode(url, req))

  >>> rex = Rex('-', 'rex.web')
  >>> rex.on()

  >>> print(Request.blank('/url?url=sandbox:/').get_response(rex)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#url", ["http://localhost/"]]

  >>> print(Request.blank('/url?url=/').get_response(rex)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#url", ["http://localhost/"]]

  >>> rex.off()

PortURL
=======

It is useful to have JavaScript code to distinguish between URL and URL for
ports::

  >>> validate = URLVal(PortURL)

  >>> port = validate("sandbox:/")
  >>> port
  PortURL(route='sandbox:/', params=None)

``PortURL`` values have different JSON representation than ``URL`` values::

  >>> class RenderPort(Command):
  ...   path = '/port'
  ...   access = 'anybody'
  ... 
  ...   def render(self, req):
  ...     return Response(encode(port, req))

  >>> rex = Rex('-', 'rex.web')
  >>> rex.on()

  >>> print(Request.blank('/port').get_response(rex)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#port", ["http://localhost/"]]

  >>> rex.off()

QueryURL
========

The same mechanism works for URL for HTSQL queries::

  >>> validate = URLVal(QueryURL)

  >>> query = validate("sandbox:/")
  >>> query
  QueryURL(route='sandbox:/', params=None)

``QueryURL`` values have different JSON representation than ``PortURL`` and ``URL``
values::

  >>> class RenderQuery(Command):
  ...   path = '/query'
  ...   access = 'anybody'
  ... 
  ...   def render(self, req):
  ...     return Response(encode(query, req))

  >>> rex = Rex('-', 'rex.web')
  >>> rex.on()

  >>> print(Request.blank('/query').get_response(rex)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#query", ["http://localhost/"]]

  >>> rex.off()

