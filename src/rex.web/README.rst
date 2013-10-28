*****************************
  REX.WEB Programming Guide
*****************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: meth(literal)
.. role:: attr(literal)
.. role:: func(literal)


Overview
========

This package provides an extensible web stack for the RexDB platform.  It
includes:

* server for static resources;
* mapper from specific URLs to Python handlers;
* authentication and authorization mechanism.
* support for templates;
* client-side sessions;
* customizable error handlers.

The RexDB web stack is built on top of the following packages:

* WebOb_ for HTTP request and response objects;
* Jinja2_ for templates;
* PyCrypto_ and PBKDF2_ for crypto services.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute
Of Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. _WebOb: http://docs.webob.org/
.. _Jinja2: http://jinja.pocoo.org/
.. _PyCrypto: http://www.pycrypto.org/
.. _PBKDF2: http://www.dlitz.net/software/python-pbkdf2/
.. |R| unicode:: 0xAE .. registered trademark sign


Handling HTTP requests
======================

To have a functional web stack, RexDB applications should (directly or
indirectly) include :mod:`rex.web` package.  For example, :mod:`rex.web_demo`
package pulls :mod:`rex.web` as a dependency::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.web_demo')

There are two primary ways a RexDB application could handle HTTP requests:
using static resources and using HTTP commands.

To make a static file available via HTTP, put it to the ``www`` directory.  For
example, :mod:`rex.web_demo` has a file ``rex.web_demo/static/www/index.html``
with the following content::

    <!DOCTYPE html>
    <title>Welcome to REX.WEB_DEMO!</title>

By default, access to static files is restricted to authenticated users only.
To make ``index.html`` publicly available, we added the following line to the
*access* file ``rex.web_demo/static/www/_access.yaml``::

    - /index.html: anybody

Now we could request this file via HTTP::

    >>> from webob import Request

    >>> req = Request.blank('/index.html')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 55
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Welcome to REX.WEB_DEMO!</title>

.. note::

    :mod:`rex.web` uses ``Request`` and ``Response`` objects from WebOb_
    package; see WebOb_ comprehensive documentation.

To handle a specific URL in Python, define a subclass of
:class:`rex.web.Command`.  For example, :mod:`rex.web_demo` declares
the following command::

    from rex.core import StrVal
    from rex.web import Command, Parameter
    from webob import Response

    class HelloCmd(Command):

        path = '/hello'
        access = 'anybody'
        parameters = [
            Parameter('name', StrVal('[A-Za-z]+'), default='World'),
        ]

        def render(self, req, name):
            return Response("Hello, %s!" % name, content_type='text/plain')

This code creates an HTTP command that

* handles URL ``/hello`` (``path`` attribute);
* is publicly accessible (``access`` attribute);
* expects form parameter ``name`` (``parameters`` attribute).

A command must override method :meth:`rex.web.Command.render()`, which takes a
``Request`` object and form parameters and should return a ``Response`` object.

Now we could execute the command::

    >>> req = Request.blank('/hello?name=Alice')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 13
    <BLANKLINE>
    Hello, Alice!


Routing pipeline
================

The following diagram shows how :mod:`rex.web` routes incoming HTTP requests::

       o
       |  (joint pipeline)
    +--|-----------------+
    |  v                 |
    | SessionManager     |
    |  |                 |
    |  v                 |
    | ErrorCatcher -----------------> HandleError
    |  |                 |
    |  v                 |
    | SegmentMapper      |
    |  |  |  |           |
    +--|--|--|-----------+
       |  |  |
    +--|-----------------+
    |  v                 |+
    | PackageGate        ||+
    |  |                 |||
    |  v                 |||
    | StaticServer -----------------> HandleFile
    |  |                 |||
    |  v                 |||
    | CommandDispatcher ------------> HandleLocation, Command
    |                    |||
    +--------------------+||
     +--------------------+|
      +--------------------+
         (package pipelines)          (extensible interfaces)

The blocks on the left represents the fixed parts of the routing pipeline; a
RexDB application has little control over it.  The elements on the right are
interfaces which could be customized by the application.

The pipeline consists of the following components:

``SessionManager``
    Manages user sessions.

    Adds the following variables to the request environment:

    ``rex.session``
        A JSON dictionary passed to/from a client using an encrypted cookie.
    ``rex.mount``
        A dictionary mapping package names to absolute URLs; generated from
        ``mount`` configuration parameter.

``ErrorCatcher``
    Intercepts HTTP exceptions raised by other components of the pipeline.

    Implement :class:`rex.web.HandleError` interface to customize response for
    specific HTTP errors such as as ``401 Not Authorized`` or ``404 Not
    Found``.

``SegmentMapper``
    Determines which package will handle the incoming request.

    By default, the first package in the requirement list is mounted at ``/``,
    and any other package ``<package>.<name>`` is mounted at ``/<name>``.  You
    can override default mount points using ``mount`` configuration parameter.

``PackageGate``
    Adds the following variables to the reques environment:

    ``rex.package``
        The name of the package that handles the request.

``StaticServer``
    Serves static files from the ``/www`` directory.

    Implement :class:`rex.web.HandleFile` interface to customize rendering for
    a specific file type.

``CommandDispatcher``
    Dispatches requests to Python handlers.

    Implement :class:`rex.web.HandleLocation` interface to provide a handler
    for a specific URL.

    You can also use :class:`rex.web.Command`, a specialized variant of
    :class:`rex.web.HandleLocation` with built-in authorization and form
    parameters parsing.

An application may add additional components to the package pipeline by
implementing :class:`rex.web.Route` interface.


Error Handlers
==============

Implement :class:`rex.web.HandleError` interface to customize response on
specific HTTP errors.

For example, :mod:`rex.web_demo` responds to ``404 Not Found`` with an HTML
page generated from template ``rex.web_demo/static/templates/404.html``::

    from rex.web import HandleError, render_to_response

    class HandleNotFound(HandleError):

        code = 404
        template = 'rex.web_demo:/templates/404.html'

        def __call__(self, req):
            return render_to_response(self.template, req, status=self.code,
                                      path=req.path)

Attribute :attr:`.HandleError.code` specifies the type of HTTP errors handled
by the implementation.

You can see how this handler works by submitting a non-existing URL to the
application::

    >>> req = Request.blank('/not-found')
    >>> print req.get_response(demo)
    404 Not Found
    Content-Type: text/html; charset=UTF-8
    Content-Length: 145
    <BLANKLINE>
    <!DOCTYPE html>
    <html>
      <head><title>Page not found: /not-found</title></head>
      <body>The server cannot find the requested page!</body>
    </html>


File Handlers
=============

To serve static resources such as CSS, Javascript and image files, put them
to the ``www`` subdirectory.  For example, package :mod:`rex.web_demo` keeps
resources available via HTTP in ``rex.web_demo/static/www``.

By default, static files are served as is, but you can customize rendering for
specific file types using :class:`rex.web.HandleFile` interface.  For example,
:mod:`rex.web_demo` renders reStructuredText_ files in HTML::

    from rex.core import get_packages
    from rex.web import HandleFile
    from webob import Response
    import docutils.core

    class HandleRST(HandleFile):

        ext = '.rst'

        def __call__(self, req):
            # Load the file.
            packages = get_packages()
            with packages.open(self.path) as rst_file:
                rst_input = rst_file.read()

            # Render to HTML.
            html_output = docutils.core.publish_string(rst_input,
                                                       writer_name='html')

            # Generate the response.
            return Response(html_output)

.. _reStructuredText: http://docutils.sourceforge.net/rst.html

Package :mod:`rex.web_demo` contains a static RST file
``rex.web_demo/static/www/example.rst``::

    reStructuredText Example
    ========================

    This file is in reStructuredText_ format, but when served as a part of
    ``rex.web_demo`` application, it is rendered as HTML.

    .. _reStructuredText: http://docutils.sourceforge.net/rst.html

When we request this file with URL ``/example.rst``, we see HTML output::

    >>> req = Request.blank('/example.rst')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: text/html; charset=UTF-8
    ...
    <p>This file is in <a class="reference external"
    href="http://docutils.sourceforge.net/rst.html">reStructuredText</a>
    format, but when served as a part of <tt class="docutils
    literal">rex.web_demo</tt> application, it is rendered as HTML.</p>
    ...


Location Handlers
=================

Implement :class:`rex.web.HandleLocation` interface to handle a specific URL.

For example, :mod:`rex.web_demo` handles URL ``/ping`` in the following
manner::

    from rex.web import HandleLocation
    from webob import Response

    class HandlePing(HandleLocation):

        path = '/ping'

        def __call__(self, req):
            return Response(content_type='text/plain', body="PONG!")

Attribute :attr:`.HandleLocation.path` indicates the URL served by the handler.

In this example, the handler returns a response ``PONG!``::

    >>> req = Request.blank('/ping')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 5
    <BLANKLINE>
    PONG!

.. warning::

    :class:`.HandleLocation` does not have built-in authorization
    checks.  Use :class:`.Command` if you need built-in authorization
    and parameter parsing.


Commands
========

:class:`rex.web.Command` is a specialized variant of
:class:`rex.web.HandleLocation` with support for authorization and parsing
query parameters.

``rex.web_demo`` provides a JSON service calculating the *factorial*
of the given positive integer ``n``::

    >>> req = Request.blank('/factorial?n=10')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 21
    <BLANKLINE>
    {"n!":3628800,"n":10}

This service is implemented as a subclass of :class:`.Command`::

    from rex.core import PIntVal
    from rex.web import Command, Parameter
    from webob import Response

    class FactorialCmd(Command):

        path = '/factorial'
        access = 'anybody'
        parameters = [
                Parameter('n', PIntVal()),
        ]

        def render(self, req, n):
            f = 1
            for k in range(1, n+1):
                f = f * k
            return Response(json={"n": n, "n!": f})

:attr:`.Command.path`
    URL handled by the command.

:attr:`.Command.access`
    The permission required to perform the request.  Permission *anybody*
    allows anyone to perform the request.  If this attribute is not set,
    *authenticated* permission is assumed.

:attr:`.Command.parameters`
    List of query parameters expected by the command.  For each parameter,
    specify its name, the format and the default value.  If the default
    value is not provided, the parameter is mandatory.

:meth:`.Command.render`
    This method must be overridden by implementations.  It takes the incoming
    HTTP request and parsed query parameters and returns the HTTP response.


Authentication and authorization
================================

*Authentication* is finding who made the request.  *Authorization* is verifying
whether the request has a certain permission.  In :mod:`rex.web`, these two
services are implemented by functions :func:`rex.web.authenticate()` and
:func:`rex.web.authorize()`.

Function :func:`rex.web.authenticate()` takes the incoming request and returns
the user that performed the request or ``None``::

    >>> from rex.web import authenticate, authorize

    >>> anon_req = Request.blank('/')
    >>> with demo:
    ...     print authenticate(anon_req)
    None

    >>> auth_req = Request.blank('/')
    >>> auth_req.remote_user = 'Bob'
    >>> with demo:
    ...     print authenticate(auth_req)
    Bob

By default, :func:`.authenticate()` assumes that the user is stored in CGI
variable ``REMOTE_USER``.  To customize authentication, applications need to
implement :class:`rex.web.Authenticate` interface.

Function :func:`rex.web.authorize()` takes the incoming request and permission
name and returns whether or not the request is given the permission::

    >>> demo.on()

    >>> authorize(anon_req, 'anybody')
    True
    >>> authorize(anon_req, 'authenticated')
    False

    >>> authorize(auth_req, 'anybody')
    True
    >>> authorize(auth_req, 'authenticated')
    True

    >>> demo.off()

:mod:`rex.web` defines three permissions:

``'authenticated'``
    Any logged in user is allowed to perform this action.

``'anybody'``
    Anyone is allowed to perform this action.

``'nobody'``
    No one is allowed to perform this action.

To add another permission, applications should implement
:class:`rex.web.Authorize` interface.

Permissions are used to limit access to commands and static files.

For commands, use attribute :class:`rex.web.Command.access` to specify the
necessary permission.  By default, commands require *authenticated* permission.

Static files served from the ``www`` directory require *authenticated*
permission unless overridden in *access* file ``_access.yaml``.  This file must
contain an ordered dictionary that maps path patterns to respective
permissions.  For example, :mod:`rex.web_demo` has the following access file
``rex.web_demo/static/www/_access.yaml``::

- /index.html   : anybody
- /page.html    : anybody
- /example.rst  : anybody
- /*.png        : anybody
- /*            : nobody


CSRF protection
===============

:class:`rex.web.Command` provides optional protection against Cross-Site
Scripting Forgery (CSRF) attacks.

To perform a CSRF attack, the attacker only needs to trick a user to visit a
malicious web page.  If the user is currently authenticated with the
application, the attacker will be able to perform arbitrary actions using the
identity of the user.  For more information on CSRF, see
https://www.owasp.org/index.php/Cross-Site_Request_Forgery_%28CSRF%29.

Any command that performs actions such as changing the user email address, home
address or password, or, in general, alters the user or the application data in
any way, should be protected against CSRF attacks.

To enable CSRF projection, a command should set attribute
:attr:`.Command.unsafe` to ``True``.  Here is an example from
:mod:`rex.web_demo`::

    class UnsafeCmd(Command):

        path = '/unsafe'
        access = 'anybody'
        unsafe = True

        def render(self, req, n):
            return Response("I trust you!", content_type='text/plain')

To make a request to an unsafe command, a web page must send a so-called CSRF
token along with the request.  The value of the token could added to a template
using variables ``CSRF_INPUT_TAG`` or ``CSRF_META_TAG``.

``CSRF_INPUT_TAG`` should be added with any ``<form>`` tag that executes an
unsafe command.  For example::

    <form action="/unsafe" method="POST">
      {{ CSRF_INPUT_TAG }}
      <input type="submit" value="Click to perform the unsafe command">
    </form>

Forms that include ``CSRF_INPUT_TAG`` must use HTTP method ``POST`` to prevent
leakage of the CSRF token value.

You may also want to execute an unsafe command using an Ajax request.
Use ``CSRF_META_TAG`` to add the value of the CSRF token to the page header::

    <head>
      <title>Testing CSRF protection</title>
      <script src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
      {{ CSRF_META_TAG }}
    </head>

This tag is rendered as::

    <meta name="_csrf_token" content="...">

You can find the value of the token with the following Javascript fragment::

    var csrf_token = $('meta[name="_csrf_token"]').attr('content');

To make an Ajax request to an unsafe command, pass the token using
``X-CSRF-Token`` HTTP header::

    $.ajax("/unsafe", {
      'headers': { "X-CSRF-Token": csrf_token },
      'complete': function (xhr, text) { alert(text); }
    });


Templates
=========

:mod:`rex.web` supports templates based on Jinja2_.  Use function
:func:`rex.web.render_to_response()` to render a template and generate an HTTP
response::

    >>> from rex.web import render_to_response

    >>> req = Request.blank('/')
    >>> with demo:
    ...     print render_to_response('rex.web_demo:/templates/hello.html', req,
    ...                              name='World')
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 68
    <BLANKLINE>
    <!DOCTYPE html>
    <title>Greetings!</title>
    <body>Hello, World!</body>

Path ``rex.web_demo:/templates/hello.html`` refers to the file
``rex.web_demo/static/templates/hello.html``, which contains::

    <!DOCTYPE html>
    <title>Greetings!</title>
    <body>Hello, {{ name|e }}!</body>

In the template body, you can use ``{{ ... }}`` brackets to substitute template
parameters passed via :func:`.render_to_response()`.  For more information on
special template tags, see Jinja2_ documentation.

Static resources with extension ``.html`` are also rendered as templates.  For
example, URL ``/page.html`` from :mod:`rex.web_demo` renders as follows::

    >>> req = Request.blank('/page.html')
    >>> print req.get_response(demo)
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 183
    <BLANKLINE>
    <!DOCTYPE html>
    <html>
    <head><title>Under Construction!</title></head>
    <body>
    <p><img src="http://localhost/img/Construction.png"> This page is under construction.</p>
    </body>
    </html>

This page is constructed from the template
``rex.web_demo/static/www/page.html``::

    {% extends "/templates/base.html" %}
    {% block title %}Under Construction!{% endblock %}
    {% block body %}
    <p><img src="{{ MOUNT['rex.web_demo'] }}/img/Construction.png"> This page is under construction.</p>
    {% endblock %}

This template uses Jinja2_ inheritance mechanism to reuse the base template
from ``rex.web_demo/static/templates/base.html``::

    <!DOCTYPE html>
    <html>
    <head><title>{% block title %}{% endblock %}</title></head>
    <body>{% block body %}{% endblock %}</body>
    </html>

Note that you may use parameter ``MOUNT`` to find the absolute URL of a
package.


Settings
========

:mod:`rex.web` declares the following settings.

``mount``
    Table mapping package names to URL segments.  If not set, generated
    automatically.

    It is permitted for two or more packages to share the mount point.
    In this case, the request is handled by the first package that has
    a command or a static resource that matches the URL.

    This setting could be specified more than once.  Mount tables preset
    by different packages are merged into one.

``secret``
    Passphrase used for generating encryption and validation keys for the
    session cookie.  If not set, random keys are generated.  This setting must
    be set if the application is running under a multi-process server.


