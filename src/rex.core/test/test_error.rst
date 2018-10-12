*******************
  Error reporting
*******************

.. contents:: Table of Contents


``Error``
=========

RexDB API should use ``rex.core.Error`` and its subclasses for error reporting.
The exception constructor takes the error message and optional payload::

    >>> from rex.core import Error

    >>> raise Error("Got no money!")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got no money!

    >>> raise Error("Found no product:", "beer")
    Traceback (most recent call last):
      ...
    rex.core.Error: Found no product:
        beer

The error may contain multiple paragraphs::

    >>> product = "beer"
    >>> where = "refrigerator #%s" % 3
    >>> try:
    ...     raise Error("Found no product:", product)
    ... except Error as _error:
    ...     error = _error
    ...     error.wrap("While looking in:", where)
    ...     raise
    Traceback (most recent call last):
      ...
    rex.core.Error: Found no product:
        beer
    While looking in:
        refrigerator #3

    >>> error
    Error('Found no product:', 'beer').wrap('While looking in:', 'refrigerator #3')
    >>> error.paragraphs
    [Paragraph('Found no product:', 'beer'), Paragraph('While looking in:', 'refrigerator #3')]

Errors have WSGI interface and are rendered either in ``text/plain`` or
``text/html``::

    >>> from wsgiref.util import setup_testing_defaults
    >>> environ = {}
    >>> setup_testing_defaults(environ)

    >>> def start_response(status, headers, exc_info=None):
    ...     print(status)
    ...     for key, value in headers:
    ...         print("%s: %s" % (key, value))
    ...     print()

    >>> print(b"".join(error(environ, start_response)).decode('utf-8'))
    400 Bad Request
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 131
    <BLANKLINE>
    The server cannot understand the request due to malformed syntax.
    <BLANKLINE>
    Found no product:
        beer
    While looking in:
        refrigerator #3

    >>> environ['HTTP_ACCEPT'] = 'text/html'
    >>> print(b"".join(error(environ, start_response)).decode('utf-8'))
    400 Bad Request
    Content-Type: text/html; charset=UTF-8
    Content-Length: 275
    <BLANKLINE>
    <html>
    <head>
    <title>400 Bad Request</title>
    </head>
    <body>
    <h1>400 Bad Request</h1>
    The server cannot understand the request due to malformed syntax.<br /><br />
    Found no product:<br />
    <pre>beer</pre><br />
    While looking in:<br />
    <pre>refrigerator #3</pre>
    </body>
    </html>


``guard``
=========

``guard`` context manager adds a paragraph to all escaping errors::

    >>> from rex.core import guard

    >>> with guard("While looking in:", where):
    ...     raise Error("Found no product:", product)
    Traceback (most recent call last):
      ...
    rex.core.Error: Found no product:
        beer
    While looking in:
        refrigerator #3


Sentry integration
==================

``rex.core`` is integrated with the Sentry error tracker.  To use Sentry, you
must provide the Sentry *DSN*, a URL-like value that contains the address of
the Sentry server and authentication information.  The DSN must be specified as
an environment variable ``SENTRY_DSN``::

    >>> import os

    >>> _environ = os.environ

    >>> os.environ = {'SENTRY_DSN': 'http://pk:sk@hostname:9000/1'}

Any additional environment variables that start with ``SENTRY_`` are added to
the configuration as tags::

    >>> os.environ['SENTRY_PROJECT'] = 'rex.core_demo'
    >>> os.environ['SENTRY_VERSION'] = '1.0.0'

We can use function ``get_sentry`` to get an instance of the Sentry client::

    >>> from rex.core import get_sentry

    >>> sentry = get_sentry()
    >>> sentry                  # doctest: +ELLIPSIS
    <raven.base.Client object at ...>

To get a DSN suitable for use in Javascript code, we can use::

    >>> sentry.get_public_dsn()
    '//pk@hostname:9000/1'

We can also get a list of tags::

    >>> sentry.tags
    {'project': 'rex.core_demo', 'version': '1.0.0'}

    >>> os.environ = _environ



