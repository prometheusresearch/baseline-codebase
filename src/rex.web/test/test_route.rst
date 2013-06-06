********************
  Routing Pipeline
********************

.. contents:: Table of Contents


Sessions
========

A session is a small JSON dictionary stored in a secure cookie.

Define three commands to store, retrieve and delete an integer
value in a session object::

    >>> from rex.web import Command, Parameter
    >>> from rex.core import IntVal
    >>> from webob import Request, Response

    >>> class SetCmd(Command):
    ...     path = '/set'
    ...     role = 'anybody'
    ...     parameters = [Parameter('x', IntVal())]
    ...     def render(self, req, x):
    ...         req.session['x'] = x
    ...         return Response("x is set to %s" % x,
    ...                         content_type='text/plain')

    >>> class GetCmd(Command):
    ...     path = '/get'
    ...     role = 'anybody'
    ...     def render(self, req):
    ...         if 'x' in req.session:
    ...             return Response("x is equal to %s" % req.session['x'],
    ...                             content_type='text/plain')
    ...         else:
    ...             return Response("x is not set", content_type='text/plain')

    >>> class DelCmd(Command):
    ...     path = '/del'
    ...     role = 'anybody'
    ...     def render(self, req):
    ...         req.session.pop('x', None)
    ...         return Response("x is unset", content_type='text/plain')

Parameter ``secret`` is used for generating encryption and validation keys::

    >>> from rex.core import Rex
    >>> main = Rex('__main__', 'rex.web', secret="secret passphrase")

Session is empty::

    >>> req = Request.blank('/get')
    >>> print req.get_response(main)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 12
    <BLANKLINE>
    x is not set

Session is ``{"x":123}``::

    >>> req = Request.blank('/set?x=123')
    >>> resp = req.get_response(main)
    >>> print resp                      # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 15
    Set-Cookie: rex.session=...--; Path=/; HttpOnly
    <BLANKLINE>
    x is set to 123
    >>> session_cookie = resp.headers['Set-Cookie'].split('=')[1].split(';')[0]

Check that session we could decode our session::

    >>> req = Request.blank('/get')
    >>> req.cookies['rex.session'] = session_cookie
    >>> print req.get_response(main)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 17
    <BLANKLINE>
    x is equal to 123

When session is updated, a new cookie is set::

    >>> req = Request.blank('/set?x=456')
    >>> resp = req.get_response(main)
    >>> print resp                      # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 15
    Set-Cookie: rex.session=...--; Path=/; HttpOnly
    <BLANKLINE>
    x is set to 456
    >>> session_cookie = resp.headers['Set-Cookie'].split('=')[1].split(';')[0]

    >>> req = Request.blank('/get')
    >>> req.cookies['rex.session'] = session_cookie
    >>> print req.get_response(main)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 17
    <BLANKLINE>
    x is equal to 456

When the session becomes empty, the cookie is deleted::

    >>> req = Request.blank('/del')
    >>> req.cookies['rex.session'] = session_cookie
    >>> print req.get_response(main)    # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 10
    Set-Cookie: rex.session=; Max-Age=0; Path=/; expires=... GMT
    <BLANKLINE>
    x is unset

Cookie size is limited to 4096 characters::

    >>> req = Request.blank('/set?x='+'9'*4096)
    >>> print req.get_response(main)
    Traceback (most recent call last):
      ...
    AssertionError: session data is too large

Invalid session cookies are ignored::

    >>> req = Request.blank('/get')
    >>> req.cookies['rex.session'] = 'AAA'
    >>> print req.get_response(main)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 12
    <BLANKLINE>
    x is not set

    >>> req = Request.blank('/get')
    >>> req.cookies['rex.session'] = 'PT0-' # b2a('==')
    >>> print req.get_response(main)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 12
    <BLANKLINE>
    x is not set

    >>> req = Request.blank('/get')
    >>> req.cookies['rex.session'] = 'zUaECX_zxWTyQvcf.MHKCpDhPRRDGcyw26oq0g1P22o-' # b2a(sign(''))
    >>> print req.get_response(main)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 12
    <BLANKLINE>
    x is not set

    >>> req = Request.blank('/get')
    >>> req.cookies['rex.session'] = 'zUaECX_zxWTyQvcf.MHKCpDhPRRDGcyw26oq0g1P22rm' \
    ...                              '3XJdKjKKwg6sj5sXcAUYb.cxR8AlFhibORPc2GAK6w--' # b2a(sign('')+encrypt(''))
    >>> print req.get_response(main)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 12
    <BLANKLINE>
    x is not set

If a secret passphrase is not provided, random keys are generated::

    >>> main = Rex('__main__', 'rex.web')
    >>> req = Request.blank('/set?x=123')
    >>> resp = req.get_response(main)
    >>> print resp                      # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 15
    Set-Cookie: rex.session=...--; Path=/; HttpOnly
    <BLANKLINE>
    x is set to 123


Routing packages
================

Setting ``mount`` maps packages to URL segments.  When not specified,
URL segments are generated from package names::

    >>> from rex.core import get_settings
    >>> demo = Rex('rex.web_demo', './test/data/shared/')

    >>> with demo:
    ...     mount = get_settings().mount
    ...     for name, segment in sorted(mount.items()):
    ...         print "%s -> /%s" % (name, segment)
    rex.web_demo -> /
    shared -> /shared

Within the web stack, the mount table is available as attribute ``mount``
of the ``Request`` object or variable ``MOUNT`` in templates.  These
tables contain absolute URLs and should be used for referencing::

    >>> req = Request.blank('/shared/index.html')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 160
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Shared resources</title>
    <style src="http://localhost/shared/css/base.css"></style>
    <body>Commonly used resources are stored here.</body>

Mount table could be overridden::

    >>> shared = Rex('rex.web_demo', './test/data/shared/',
    ...              mount={'rex.web_demo': '/demo', 'shared': '/'})

    >>> req = Request.blank('/index.html')
    >>> print req.get_response(shared)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 153
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Shared resources</title>
    <style src="http://localhost/css/base.css"></style>
    <body>Commonly used resources are stored here.</body>

    >>> req = Request.blank('/demo/hello')
    >>> print req.get_response(shared)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 13
    <BLANKLINE>
    Hello, World!

Invalid mount tables are rejected::

    >>> Rex('rex.web_demo', mount={'shared': '/'})  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Expected one of:
        rex.web_demo
    Got:
        'shared'
    While validating mapping key:
        'shared'
    While validating setting:
        mount
    ...

    >>> Rex('rex.web_demo', './test/data/shared/',
    ...     mount={'shared': '/'})                  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Got duplicate mount URL:
        /
    While validating setting:
        mount
    ...

The root URL does not have to be mounted::

    >>> rootless = Rex('rex.web_demo', './test/data/shared/',
    ...                mount={'rex.web_demo': '/demo'})
    >>> req = Request.blank('/')
    >>> print req.get_response(rootless)            # doctest: +ELLIPSIS
    404 Not Found
    ...


Handling errors
===============

Interface ``HandleError`` allows you to catch HTTP exceptions raised
by commands and other handlers::

    >>> from rex.web import HandleError

    >>> class HandleNotFound(HandleError):
    ...     code = 404
    ...     def __call__(self, req):
    ...         return Response("Resource not found: %s" % req.path,
    ...                         status=404)

    >>> main = Rex('__main__', 'rex.web')
    >>> req = Request.blank('/not-found')
    >>> print req.get_response(main)
    404 Not Found
    Content-Type: text/html; charset=UTF-8
    Content-Length: 30
    <BLANKLINE>
    Resource not found: /not-found

Set ``code`` to ``'*'`` to define a catch-all error handler::

    >>> class HandleAnyError(HandleError):
    ...     code = '*'
    ...     def __call__(self, req):
    ...         return Response("Something went wrong!", status=self.error.code)

    >>> main.cache.clear()
    >>> req = Request.blank('/get?x=123')
    >>> print req.get_response(main)
    400 Bad Request
    Content-Type: text/html; charset=UTF-8
    Content-Length: 21
    <BLANKLINE>
    Something went wrong!


Handling static files
=====================

Static resources in directory ``www`` are available via HTTP::

    >>> static = Rex('./test/data/static/', './test/data/access/',
    ...              '__main__', 'rex.web')

    >>> req = Request.blank('/names.csv')
    >>> req.remote_user = 'Daniel'
    >>> print req.get_response(static)
    200 OK
    Content-Type: text/csv; charset=UTF-8
    Content-Length: 23
    Last-Modified: Thu, 06 Jun 2013 19:01:04 GMT
    Accept-Ranges: bytes
    <BLANKLINE>
    name
    Alice
    Bob
    Charles
    <BLANKLINE>

By default, only authenticated users can access static resources::

    >>> req = Request.blank('/names.csv')
    >>> print req.get_response(static)      # doctest: +ELLIPSIS
    401 Unauthorized
    ...

Access is controlled by ``_access.yaml`` file::

    >>> req = Request.blank('/access/public.html')
    >>> print req.get_response(static)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 44
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Public Access</title>

    >>> req = Request.blank('/access/public/')
    >>> print req.get_response(static)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 44
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Public Access</title>

    >>> req = Request.blank('/access/protected.html')
    >>> print req.get_response(static)      # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank('/access/protected/')
    >>> print req.get_response(static)      # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank('/access/protected.html')
    >>> req.remote_user = 'Bob'
    >>> print req.get_response(static)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 52
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Authorized Users Only</title>

    >>> req = Request.blank('/access/protected/')
    >>> req.remote_user = 'Bob'
    >>> print req.get_response(static)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 52
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Authorized Users Only</title>

    >>> req = Request.blank('/access/default.csv')
    >>> print req.get_response(static)      # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req = Request.blank('/access/default.csv')
    >>> req.remote_user = 'Bob'
    >>> print req.get_response(static)
    200 OK
    Content-Type: text/csv; charset=UTF-8
    Content-Length: 24
    Last-Modified: Thu, 06 Jun 2013 19:47:50 GMT
    Accept-Ranges: bytes
    <BLANKLINE>
    names
    Alice
    Bob
    Charles
    <BLANKLINE>

If the URL refers to a directory, file ``index.html`` is served, if it exists::

    >>> req = Request.blank('/index/')
    >>> req.remote_user = 'Daniel'
    >>> print req.get_response(static)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 63
    <BLANKLINE>
    <!DOCTYPE html>
    <title>This directory has an index file</title>

    >>> req = Request.blank('/noindex/')
    >>> print req.get_response(static)      # doctest: +ELLIPSIS
    404 Not Found
    ...

If the URL that refers to a directory does not end with a trailing slash,
the slash is added using a redirect::

    >>> req = Request.blank('/index')
    >>> print req.get_response(static)
    301 Moved Permanently
    Content-Type: text/html; charset=UTF-8
    Content-Length: 0
    Location: http://localhost/index/

    >>> req = Request.blank('/noindex?name=Alice')
    >>> print req.get_response(static)
    301 Moved Permanently
    Content-Type: text/html; charset=UTF-8
    Content-Length: 0
    Location: http://localhost/noindex/?name=Alice

Files and directories that start with ``_`` or ``.`` are effectively hidden::

    >>> req = Request.blank('/_hidden.txt')
    >>> print req.get_response(static)      # doctest: +ELLIPSIS
    404 Not Found
    ...

    >>> req = Request.blank('/_hidden/hidden.txt')
    >>> print req.get_response(static)      # doctest: +ELLIPSIS
    404 Not Found
    ...

``HandleFile`` interface allows you to define a custom renderer for
certain types of files::

    >>> from rex.core import get_packages
    >>> from rex.web import HandleFile
    >>> import csv

    >>> class HandleCSV(HandleFile):
    ...     ext = '.csv'
    ...     def __call__(self, req):
    ...         rows = csv.reader(get_packages().open(self.path))
    ...         resp = Response()
    ...         resp.body_file.write("<!DOCTYPE html>\n")
    ...         resp.body_file.write("<title>%s</title>\n" % self.path)
    ...         resp.body_file.write("<body>\n")
    ...         resp.body_file.write("<table>\n")
    ...         for row in rows:
    ...             resp.body_file.write("<tr>%s</tr>\n"
    ...                     % "".join("<td>%s</td>" % item for item in row))
    ...         resp.body_file.write("</table>\n")
    ...         resp.body_file.write("</body>")
    ...         return resp

    >>> static.cache.clear()
    >>> req = Request.blank('/names.csv')
    >>> req.remote_user = 'Daniel'
    >>> print req.get_response(static)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 179
    <BLANKLINE>
    <!DOCTYPE html>
    <title>static:/www/names.csv</title>
    <body>
    <table>
    <tr><td>name</td></tr>
    <tr><td>Alice</td></tr>
    <tr><td>Bob</td></tr>
    <tr><td>Charles</td></tr>
    </table>
    </body>


Location handlers
=================

Interface ``HandleLocation`` allows you to handle specific URLs in Python::

    >>> from rex.web import HandleLocation

    >>> class HandlePing(HandleLocation):
    ...     path = '/ping'
    ...     def __call__(self, req):
    ...         return Response("PONG!", content_type='text/plain')

    >>> main.cache.clear()
    >>> req = Request.blank('/ping')
    >>> print req.get_response(main)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 5
    <BLANKLINE>
    PONG!

Set ``path`` to ``'*'`` to make a catch-all handler::

    >>> class HandleAll(HandleLocation):
    ...     path = '*'
    ...     def __call__(self, req):
    ...         return Response("How can I help you?", content_type='text/plain')

    >>> main.cache.clear()
    >>> req = Request.blank('/help/me')
    >>> print req.get_response(main)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 19
    <BLANKLINE>
    How can I help you?


