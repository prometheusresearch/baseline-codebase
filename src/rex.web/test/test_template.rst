*************
  Templates
*************

.. contents:: Table of Contents


``render_to_response()``
========================

Function ``render_to_response()`` renders a template and generates an HTTP
response object::

    >>> from rex.core import Rex
    >>> templating = Rex('rex.web_demo', './test/data/templating/')

    >>> from rex.web import render_to_response
    >>> from webob import Request
    >>> req = Request.blank('/')

    >>> with templating:
    ...     print(render_to_response('templating:/templates/hello.html', req,
    ...                              name='World'))
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 64
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Hello!</title>
    <body>Hello, World!</body>

You can override status code and content type of the response::

    >>> with templating:
    ...     print(render_to_response('templating:/templates/404.html_t', req,
    ...                              status=404, content_type='text/html'))
    404 Not Found
    Content-Type: text/html; charset=UTF-8
    Content-Length: 40
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Not Found</title>

If the content type is not set and cannot be guessed from the extension,
the default is used::

    >>> with templating:
    ...     print(render_to_response('templating:/templates/data.tmpl', req))
    200 OK
    Content-Type: application/octet-stream; charset=UTF-8
    Content-Length: 47
    <BLANKLINE>
    This template has an undetermined content type.

Standard Jinja error is raised when a template cannot be found::

    >>> with templating:
    ...     print(render_to_response('templating:/templates/not-found.html', req))
    Traceback (most recent call last):
      ...
    TemplateNotFound: templating:/templates/not-found.html


Path resolution
===============

You can refer to other templates from a template using a relative, absolute of
package paths::

    >>> req = Request.blank('/')

    >>> templating.on()
    >>> print(render_to_response('templating:/templates/relative.html', req))
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 126
    <BLANKLINE>
    <!DOCTYPE html>
    <title>base.html</title>
    <body><p>This template uses a relative path to refer to the base template.</p></body>
    >>> print(render_to_response('templating:/templates/absolute.html', req))
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 138
    <BLANKLINE>
    <!DOCTYPE html>
    <title>/templates/base.html</title>
    <body><p>This template uses an absolute path to refer to the base template.</p></body>
    >>> print(render_to_response('templating:/templates/package.html', req))
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 152
    <BLANKLINE>
    <!DOCTYPE html>
    <title>templating:/templates/base.html</title>
    <body><p>This template uses a full package path to refer to the base template.</p></body>
    >>> templating.off()


HTML templates
==============

Files with extensions ``.html``, ``.js_t``, ``.css_t`` found in the ``www``
directory are rendered as Jinja templates::

    >>> req = Request.blank('/templating/?name=Alice')
    >>> req.remote_user = 'Bob'

    >>> print(req.get_response(templating))
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 286
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Index</title>
    <body>
    <p>The address of this page is <a href="http://localhost/templating/index.html">index.html</a>.</p>
    <p>The value of parameter <code>name</code> is <code>Alice</code>.</p>
    <p>The user that initiated the request is <code>Bob</code>.</p>
    </body>

Each template gets a number of parameters::

    >>> req = Request.blank('/templating/parameters.html?dummy=1')
    >>> req.remote_user = 'Alice'

    >>> print(req.get_response(templating))      # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/html; charset=UTF-8
    ...
    <body>
    <p><code>CSRF_INPUT_TAG:</code><code>&lt;input name=&#34;_csrf_token&#34; type=&#34;hidden&#34; value=&#34;...&#34;&gt;</code></p>
    <p><code>CSRF_META_TAG:</code><code>&lt;meta name=&#34;_csrf_token&#34; content=&#34;...&#34;&gt;</code></p>
    <p><code>CSRF_TOKEN:</code><code>...</code></p>
    <p><code>MOUNT:</code><code>{...}</code></p>
    <p><code>PACKAGE:</code><code>templating</code></p>
    <p><code>PACKAGE_URL:</code><code>http://localhost/templating</code></p>
    <p><code>PARAMS:</code><code>NestedMultiDict([(u&#39;dummy&#39;, u&#39;1&#39;)])</code></p>
    <p><code>PATH:</code><code>/templating/parameters.html</code></p>
    <p><code>PATH_QS:</code><code>/templating/parameters.html?dummy=1</code></p>
    <p><code>PATH_URL:</code><code>http://localhost/templating/parameters.html</code></p>
    <p><code>REQUEST:</code><code>GET /templating/parameters.html?dummy=1 HTTP/1.0
    Host: localhost:80</code></p>
    <p><code>SETTINGS:</code><code>SettingCollection(...)</code></p>
    <p><code>URL:</code><code>http://localhost/templating/parameters.html?dummy=1</code></p>
    <p><code>USER:</code><code>Alice</code></p>
    </body>


Custom filters, globals and tests
=================================

Filter ``json`` serializes input to JSON::

    >>> req = Request.blank('/')
    >>> with templating:
    ...     print(render_to_response('templating:/templates/json.js_t', req,
    ...                              content_type='application/javascript',
    ...                              input={'name': "Alice", 'sex': "f"}))
    200 OK
    Content-Type: application/javascript; charset=UTF-8
    Content-Length: 42
    <BLANKLINE>
    var input = {"name": "Alice", "sex": "f"};

The output of ``json`` is safe to use in a ``<script>`` block::

    >>> req = Request.blank('/')
    >>> with templating:
    ...     print(render_to_response('templating:/templates/json_in_script.html', req,
    ...                              tag={'start': "<title>",
    ...                                   'end': "</title>",
    ...                                   'content': "Alice, Bob & Carl"}))
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 196
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Testing JSON in &lt;script&gt; block</title>
    <script>
      var tag = {"content": "Alice, Bob \u0026 Carl", "start": "\u003ctitle\u003e", "end": "\u003c/title\u003e"};
    </script>

Filter ``urlencode`` percent-encodes the value::

    >>> with templating:
    ...     print(render_to_response('templating:/templates/urlencode.html', req,
    ...                              name="Alice, Bob & Carl"))             # doctest: +ELLIPSIS
    200 OK
    ...
    <a href="/hello?Alice%2C%20Bob%20%26%20Carl">Hello, Alice, Bob &amp; Carl!</a>

The ``urlencode`` filter accepts regular and Unicode strings, dictionaries and
lists of pairs:

    >>> with templating:
    ...     print(render_to_response('templating:/templates/urlencode.html', req,
    ...                              name={"name": "Alice, Bob & Carl"}))    # doctest: +ELLIPSIS
    200 OK
    ...
    <a href="/hello?name=Alice%2C%20Bob%20%26%20Carl">Hello, {&#39;name&#39;: &#39;Alice, Bob &amp; Carl&#39;}!</a>


    >>> with templating:
    ...     print(render_to_response('templating:/templates/urlencode.html', req,
    ...                              name=[("name", "Alice"),
    ...                                    ("name", "Bob"),
    ...                                    ("name", "Carl")]))               # doctest: +ELLIPSIS
    200 OK
    ...
    <a href="/hello?name=Alice&name=Bob&name=Carl">Hello, [(&#39;name&#39;, &#39;Alice&#39;), (&#39;name&#39;, &#39;Bob&#39;), (&#39;name&#39;, &#39;Carl&#39;)]!</a>

Non-string values are converted to a string before encoding::

    >>> with templating:
    ...     print(render_to_response('templating:/templates/urlencode.html', req,
    ...                              name=None))                             # doctest: +ELLIPSIS
    200 OK
    ...
    <a href="/hello?None">Hello, None!</a>

Filter ``url`` converts a package URL to an absolute URL::

    >>> req = Request.blank('/templating/url.html')
    >>> print(req.get_response(templating))              # doctest: +ELLIPSIS
    200 OK
    ...
    <p><a href="http://localhost/templating/index.html">Local link</a></p>
    <p><a href="http://localhost/index.html">Link to another package</a></p>
    <p><a href="http://htsql.org/">External link</a></p>
    ...

Filter ``url`` raises an error if the package URL refers to an unknown package::

    >>> req = Request.blank('/templating/bad_url.html')
    >>> print(req.get_response(templating))
    Traceback (most recent call last):
      ...
    Error: Could not find the mount point for:
        bad_package:index.html



