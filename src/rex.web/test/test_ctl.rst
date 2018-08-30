*****************
  ``rex`` Tasks
*****************

.. contents:: Table of Contents


``rex serve``
=============

To start a development HTTP server, you can use ``rex serve`` task::

    >>> import random
    >>> random_port = random.randrange(8000, 8100)

    >>> from rex.ctl import Ctl, ctl

    >>> serve_ctl = Ctl("serve rex.web_demo --port=%s" % random_port)

The server starts on localhost at the given port.  We can now make a request::

    >>> import urllib.request, urllib.parse, urllib.error, time

    >>> def get(path, port=random_port):
    ...     tries = 0
    ...     while tries < 100:
    ...         try:
    ...             return urllib.request.urlopen('http://localhost:%s%s' % (port, path)).read()
    ...         except IOError:
    ...             tries += 1
    ...             time.sleep(0.1)

    >>> print(get('/ping'))
    PONG!

We can stop the server and display the accumulated output::

    >>> print(serve_ctl.stop())      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Serving rex.web_demo on 127.0.0.1:8...
    localhost - - [...] "GET /ping HTTP/1.0" 200 5

To set the server address, use parameters ``--host`` and ``--port``::

    >>> serve_ctl = Ctl("serve rex.web_demo -h 127.0.0.1 -p %s" % random_port)

    >>> print(get('/ping'))
    PONG!

    >>> print(serve_ctl.stop())      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Serving rex.web_demo on 127.0.0.1:8...
    localhost - - [...] "GET /ping HTTP/1.0" 200 5

The server reports unhandled exceptions::

    >>> serve_ctl = Ctl("serve rex.web_demo --port=%s" % random_port)

    >>> print(get('/error'))         # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    The server encountered an unexpected condition which prevented it from fulfilling the request.

    >>> print(serve_ctl.stop())      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Serving rex.web_demo on 127.0.0.1:8...
    ----------------------------------------------------------------------
    [...] localhost => http://localhost:8.../error
    Traceback (most recent call last):
      ...
    RuntimeError: some unexpected problem occurred
    localhost - - [...] "GET /error HTTP/1.0" 500 95

If ``--debug`` is enabled, the exception traceback is displayed
in the response::

    >>> serve_ctl = Ctl("serve rex.web_demo --port=%s --debug" % random_port)

    >>> print(get('/error'))         # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    The server encountered an unexpected condition which prevented it from fulfilling the request.
    <BLANKLINE>
    [...] GET http://localhost:8.../error
    ...
    Traceback (most recent call last):
      ...
    RuntimeError: some unexpected problem occurred

    >>> print(serve_ctl.stop())      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Serving rex.web_demo on 127.0.0.1:8...
    ----------------------------------------------------------------------
    [...] localhost => http://localhost:8.../error
    Traceback (most recent call last):
      ...
    RuntimeError: some unexpected problem occurred
    localhost - - [...] "GET /error HTTP/1.0" 500 ...

Use option ``--remote-user`` to set user credentials for all HTTP queries::

    >>> serve_ctl = Ctl("serve rex.web_demo --port=%s --remote-user=Alice" % random_port)

    >>> print(get('/'))              # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    <!DOCTYPE html>
    <title>Welcome to REX.WEB_DEMO!</title>

    >>> print(serve_ctl.stop())      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Serving rex.web_demo on 127.0.0.1:8...
    localhost - Alice [...] "GET / HTTP/1.0" 200 55

You can also use option ``--environ`` to set a value of any WSGI environment
variable::

    >>> serve_ctl = Ctl("serve rex.web_demo --port=%s --environ REMOTE_USER=Bob" % random_port)

    >>> print(get('/'))              # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    <!DOCTYPE html>
    <title>Welcome to REX.WEB_DEMO!</title>

    >>> print(serve_ctl.stop())      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Serving rex.web_demo on 127.0.0.1:8...
    localhost - Bob [...] "GET / HTTP/1.0" 200 55

Options ``--watch`` and ``--watch-package`` are deprecated::

    >>> ctl("serve rex.web_demo --watch", expect=1)                 # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: Option "--watch" is deprecated
        Use "rex watch" command instead

    >>> ctl("serve rex.web_demo --watch-package rex.web", expect=1) # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: Option "--watch-package PACKAGE" is deprecated
        Use "rex watch PACKAGE" command instead


``rex watch``
=============

The package specified with ``rex watch`` must have bundles to watch::

    >>> ctl("watch rex.web", expect=1)   # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: nothing to watch

It also must be a Python package::

    >>> ctl("watch ./ --require rex.web", expect=1) # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: not a Python package: .


``rex wsgi``
============

Use command ``rex wsgi`` to generate a WSGI file::

    >>> ctl("wsgi rex.web_demo --debug")    # doctest: +NORMALIZE_WHITESPACE
    # WSGI script for the `rex.web_demo` application.
    # Use it with `uwsgi`, `mod_wsgi` or any other WSGI container.
    <BLANKLINE>
    from rex.core import Rex
    <BLANKLINE>
    requirements = [
        'rex.web_demo',
    ]
    <BLANKLINE>
    parameters = {
        'debug': True,
    }
    <BLANKLINE>
    application = Rex(*requirements, **parameters)

You can use option ``--output`` to save the output to a file::

    >>> ctl("wsgi rex.web_demo -o ./build/sandbox/web_demo.wsgi")   # doctest: +NORMALIZE_WHITESPACE

    >>> print(open("./build/sandbox/web_demo.wsgi").read())      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    # WSGI script for the `rex.web_demo` application.
    # Use it with `uwsgi`, `mod_wsgi` or any other WSGI container.
    ...


``rex serve-uwsgi``
===================

To run a RexDB application under uWSGI server, use ``rex serve-uwsgi`` command::

    >>> serve_uwsgi_ctl = Ctl("serve-uwsgi rex.web_demo"
    ...                       " --set-uwsgi need-app --set-uwsgi http-socket=:%s" % random_port)

Now you could make HTTP requests::

    >>> print(get('/ping'))
    PONG!

You can stop the server by pressing Ctrl-C::

    >>> print(serve_uwsgi_ctl.stop())                # doctest: +ELLIPSIS
    Starting uWSGI server for rex.web_demo
    [uWSGI] getting JSON configuration from /.../rex.web_demo-....json
    *** Starting uWSGI ... ***
    ...

If uWSGI configuration is not provided, an error is reported::

    >>> ctl("serve-uwsgi rex.web_demo", expect=1)   # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: missing uWSGI configuration


``rex start``, ``rex stop``, ``rex status``
===========================================

You can use ``rex start`` command to run uWSGI in daemon mode::

    >>> ctl("start rex.web_demo"
    ...     " --set-uwsgi http-socket=:%s"
    ...     " --set-uwsgi auto-procname" % random_port) # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Starting rex.web_demo (http-socket: :8..., logto: /.../rex.web_demo.log)

You can now query the server::

    >>> print(get('/ping'))
    PONG!

``rex start`` will complain if the server is already running::

    >>> ctl("start rex.web_demo", expect=1)         # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: rex.web_demo is already running

Use ``rex status`` command to get the status of the uWSGI daemon::

    >>> ctl("status rex.web_demo")                  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    rex.web_demo is running (http-socket: :8..., logto: /.../rex.web_demo.log)

You can also use ``rex status`` command to report the PID of the server and the
path to the log file::

    >>> pid_ctl = Ctl("status rex.web_demo --pid")
    >>> pid = int(pid_ctl.wait())

    >>> log_ctl = Ctl("status rex.web_demo --log")
    >>> log = open(log_ctl.wait().strip())
    >>> print(log.name)                              # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    /.../rex.web_demo.log

Use ``rex stop`` command to stop the server::

    >>> ctl("stop rex.web_demo")                    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Stopping rex.web_demo (http-socket: :8..., logto: /.../rex.web_demo.log)

``rex stop`` will fail if the server is not running::

    >>> ctl("stop rex.web_demo", expect=1)          # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: rex.web_demo is not running

``rex status`` will report if the server is not running::

    >>> ctl("status rex.web_demo")                  # doctest: +NORMALIZE_WHITESPACE
    rex.web_demo is not running

It is an error to start uWSGI with invalid configuration or without any socket
configuration::

    >>> ctl("start rex.web_demo"
    ...     " --set-uwsgi http-socket=/path/to/socket", expect=1)   # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Starting rex.web_demo (http-socket: /path/to/socket, logto: /.../rex.web_demo.log)
    [uWSGI] getting JSON configuration from /.../rex.web_demo.json
    ...
    FATAL ERROR: non-zero exit code: uwsgi /.../rex.web_demo.json

    >>> ctl("start rex.web_demo", expect=1)         # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: uWSGI sockets are not configured

If you use a non-default configuration file, the file name is used
for identifying the server::

    >>> open('./build/sandbox/web_demo.yaml', 'w').write('''
    ... project: rex.web_demo
    ... uwsgi:
    ...   http-socket: :%s
    ... ''' % (random_port+1))

    >>> ctl("start --config=./build/sandbox/web_demo.yaml")         # doctest: +ELLIPSIS
    Starting rex.web_demo (http-socket: :8..., logto: /.../rex.web_demo-web_demo.log)

If the YAML file containing state information is corrupted, the error
is silently ignored::

    >>> status_ctl = Ctl("status --config=./build/sandbox/web_demo.yaml --log")
    >>> cfg = open(status_ctl.wait().strip().replace('.log', '.yaml'), 'w')
    >>> cfg.write("'")
    >>> cfg.close()

    >>> ctl("status --config=./build/sandbox/web_demo.yaml")        # doctest: +ELLIPSIS
    rex.web_demo is running (http-socket: :8..., logto: /.../rex.web_demo-web_demo.log)

    >>> ctl("stop --config=./build/sandbox/web_demo.yaml")          # doctest: +ELLIPSIS
    Stopping rex.web_demo (http-socket: :8..., logto: /.../rex.web_demo-web_demo.log)


``rex replay``
==============

Specify ``--replay-log`` parameter to make ``rex serve`` save a log of all
incoming requests::

    >>> serve_ctl = Ctl("serve rex.web_demo --replay-log=./build/sandbox/replay.log --port=%s" % random_port)

    >>> print(get('/ping'))
    PONG!
    >>> print(get('/error'))         # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    The server encountered an unexpected condition which prevented it from fulfilling the request.

    >>> print(serve_ctl.stop())      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Serving rex.web_demo on 127.0.0.1:8...
    localhost - - [...] "GET /ping HTTP/1.0" 200 5
    ----------------------------------------------------------------------
    [...] localhost => http://localhost:8.../error
    Traceback (most recent call last):
      ...
    RuntimeError: some unexpected problem occurred
    localhost - - [...] "GET /error HTTP/1.0" 500 95

Using ``rex replay`` command, we can replay this log::

    >>> ctl("replay rex.web_demo --replay-log=./build/sandbox/replay.log") # doctest: +ELLIPSIS
    localhost - - [...] "GET /ping HTTP/1.0" 200 5
    localhost - - [...] "GET /error HTTP/1.0" 500 95
    ---
    TIME ELAPSED: ...
    REQUESTS: 2
    ERRORS: 1


