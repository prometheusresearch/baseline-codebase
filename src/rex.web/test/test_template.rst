*************
  Templates
*************

.. contents:: Table of Contents


``render_to_response()``
========================

Function ``render_to_response()`` renders a template and generates an HTTP
response object::

    >>> from rex.core import Rex
    >>> templating = Rex('rex.web', './test/data/templating/')

    >>> from rex.web import render_to_response
    >>> from webob import Request
    >>> req = Request.blank('/')

    >>> with templating:
    ...     print render_to_response('templating:/templates/hello.html', req,
    ...                              name='World')
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 64
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Hello!</title>
    <body>Hello, World!</body>

You can override status code and content type of the response::

    >>> with templating:
    ...     print render_to_response('templating:/templates/404.html_t', req,
    ...                              status=404, content_type='text/html')
    404 Not Found
    Content-Type: text/html; charset=UTF-8
    Content-Length: 40
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Not Found</title>

If the content type is not set and cannot be guessed from the extension,
the default is used::

    >>> with templating:
    ...     print render_to_response('templating:/templates/data.tmpl', req)
    200 OK
    Content-Type: application/octet-stream; charset=UTF-8
    Content-Length: 47
    <BLANKLINE>
    This template has an undetermined content type.

Standard Jinja error is raised when a template cannot be found::

    >>> with templating:
    ...     print render_to_response('templating:/templates/not-found.html', req)
    Traceback (most recent call last):
      ...
    TemplateNotFound: templating:/templates/not-found.html


Path resolution
===============

You can refer to other templates from a template using a relative, absolute of
package paths::

    >>> req = Request.blank('/')

    >>> templating.on()
    >>> print render_to_response('templating:/templates/relative.html', req)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 126
    <BLANKLINE>
    <!DOCTYPE html>
    <title>base.html</title>
    <body><p>This template uses a relative path to refer to the base template.</p></body>
    >>> print render_to_response('templating:/templates/absolute.html', req)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 138
    <BLANKLINE>
    <!DOCTYPE html>
    <title>/templates/base.html</title>
    <body><p>This template uses an absolute path to refer to the base template.</p></body>
    >>> print render_to_response('templating:/templates/package.html', req)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 152
    <BLANKLINE>
    <!DOCTYPE html>
    <title>templating:/templates/base.html</title>
    <body><p>This template uses a full package path to refer to the base template.</p></body>
    >>> templating.off()


HTML Templates
==============

Files with extensions ``.html``, ``.js_t``, ``.css_t`` found in the ``www``
directory are rendered as Jinja templates::

    >>> req = Request.blank('/templating/?name=Alice')
    >>> req.remote_user = 'Bob'

    >>> print req.get_response(templating)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 297
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Index</title>
    <body>
    <p>The address of this page is <a href="http://localhost/templating/index.html">index.html</a>.</p>
    <p>The value of parameter <code>name</code> is <code>Alice</code>.</p>
    <p>The value of <code>REMOTE_USER</code> variable is <code>Bob</code>.</p>
    </body>


Predefined Template Parameters
==============================

Each template has following predefined parameters:

`MOUNT`
  Package mount table mapping package names to absolute URLs.

`USER`
  Currently authenticated user.

`SETTINGS`
  Settings of the server.

`URL`
  Absolute URL of the request.

`PATH_QS`
  PATH_INFO and QUERY_STRING of the request

Custom filters, globals and tests
=================================

Filter ``json`` serializes input to JSON::

    >>> req = Request.blank('/')
    >>> with templating:
    ...     print render_to_response('templating:/templates/json.js_t', req,
    ...                              content_type='application/javascript',
    ...                              input={"name": 'Alice', "sex": 'f'})
    200 OK
    Content-Type: application/javascript; charset=UTF-8
    Content-Length: 42
    <BLANKLINE>
    var input = {"name": "Alice", "sex": "f"};

Filter ``urlencode`` encodes specific symbols in URLs::

    >>> req = Request.blank('/')
    >>> with templating:
    ...     print render_to_response('templating:/templates/urlencode.html',
    ...                               req)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 206
    <BLANKLINE>
    Using <b>urlencode</b> on <i>/other?x=1&y=2</i>: 
    <a href="goto?redirect=/other%3Fx%3D1%26y%3D2">Link</a> 
    Using <b>ue</b> on <i>/other?x=1&y=2</i>: 
    <a href="goto?redirect=/other%3Fx%3D1%26y%3D2">Link</a> 

Filter ``fix_script`` replaces '</script>' in a JavaScript line to prevent
browser parse fail::


    >>> req = Request.blank('/')
    >>> with templating:
    ...     print render_to_response('templating:/templates/fix_script.html',
    ...                               req,
    ...                               s1='<script> Test </script>',
    ...                               s2='some text </sCriPt> other text',
    ...                               s3='example: </  sCRiPT    >')
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 240
    <BLANKLINE>
    <html><head>
    <script type="text/javascript">
        var s1 = "<script> Test \u003c\u002fscript>";
        var s2 = "some text \u003c\u002fsCriPt> other text";
        var s3 = "example: \u003c\u002f  sCRiPT    >";
    </script>
    </head><body></body></html>
