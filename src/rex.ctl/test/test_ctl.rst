************************
  Command-line Utility
************************

.. contents:: Table of Contents


Running ``rex``
===============

To control a RexDB application, use command-line utility ``rex``::

    >>> from rex.ctl import ctl, Ctl

    >>> ctl('')                                 # doctest: +NORMALIZE_WHITESPACE
    Rex - Command-line administration utility for the RexDB platform
    Usage: rex [@instance] [<settings>...] <task> [<arguments>...]
    <BLANKLINE>
    Run rex help for general usage and a list of tasks and settings.
    Run rex help <topic> for help on a specific task or setting.

To execute a task, run ``rex <task> [parameters...]``::

    >>> ctl('hello world')                      # doctest: +NORMALIZE_WHITESPACE
    Hello, World!

To get help on task parameters, run ``rex help <task>``::

    >>> ctl("help hello")                       # doctest: +NORMALIZE_WHITESPACE
    HELLO - greet someone
    Usage: rex hello [<name>]
    <BLANKLINE>
    Run rex hello to greet the current user.  Alternatively,
    run rex hello <name> to greet the specified user.

To run an application-specific command, you need to configure the application.
One option is to pass the application name on the command line::

    >>> ctl("demo-init rex.ctl_demo")           # doctest: +NORMALIZE_WHITESPACE
    Creating database pgsql:///ctl_demo.
    Deploying application database to pgsql:///ctl_demo.
    Deploying rex.ctl_demo.
    Validating rex.ctl_demo.
    Done.
    Added user: alice@rexdb.com
    Added user: bob@rexdb.com

Another option is to use a global option ``--project``::

    >>> ctl("--project=rex.ctl_demo demo-user-list")    # doctest: +NORMALIZE_WHITESPACE
    Alice Amter (alice@rexdb.com)
    Bob Barker (bob@rexdb.com)

It is an error if the application package is not specified or if a wrong
package is specified::

    >>> ctl("demo-user-list", expect=1)         # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: application is not specified

    >>> ctl("demo-user-list rex.ctl", expect=1) # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: package rex.ctl_demo must be included with the application

To get a list of packages that compose the application, use ``rex packages``::

    >>> ctl("packages rex.ctl_demo")            # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    rex.ctl_demo == ...
    rex.port == ...
    ...

    >>> ctl("packages rex.ctl_demo --verbose")  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    [rex.ctl_demo]
    Version:
      ...
    Location:
      ...
    Resources:
      ...
    Dependencies:
      rex.deploy
      rex.port
    <BLANKLINE>
    [rex.port]
    ...

Application parameters could be specified using option ``--set`` or global
option ``--parameters``::

    >>> ctl("demo-user-list rex.ctl_demo --set db=pgsql:ctl_demo")  # doctest: +NORMALIZE_WHITESPACE
    Alice Amter (alice@rexdb.com)
    Bob Barker (bob@rexdb.com)

    >>> ctl("demo-user-list rex.ctl_demo"
    ...     " --parameters '{\"db\": \"pgsql:ctl_demo\"}'")         # doctest: +NORMALIZE_WHITESPACE
    Alice Amter (alice@rexdb.com)
    Bob Barker (bob@rexdb.com)

Invalid setting values are detected::

    >>> ctl("demo-user-list rex.ctl_demo --parameters '{[]}'", expect=1)    # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: invalid value for setting --parameters:
    Expected a JSON object
    Got:
        '{[]}'

To get a list of parameters of the application use ``rex settings``::

    >>> ctl("settings rex.ctl_demo")            # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    access:
    ...

    >>> ctl("settings rex.ctl_demo --verbose")  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    [access]
    Declared in:
      rex.web
    Description:
      ...
    [db]
    Declared in:
      rex.db
    Mandatory?
      true
    Preset in:
      rex.ctl_demo
    Value:
      'pgsql:ctl_demo'
    Description:
      ...
    [debug]
    ...

Packages may include static directories and Python modules::

    >>> ctl("packages ./test/data/shared/ -v")          # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    [shared]
    Resources:
      /.../test/data/shared
    ...

    >>> ctl("packages distutils -v")                    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    [distutils]
    Location:
      /.../distutils/__init__.py
    ...

You can inspect the application object in Python shell using ``rex pyshell``
command::

    >>> ctl("pyshell rex.ctl_demo")                     # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Type 'help' for more information, Ctrl-D to exit.
    ...

You may get more information from a command if you enable debug output::

    >>> ctl("deploy --debug rex.ctl_demo")              # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Deploying application database to pgsql:///ctl_demo.
    Deploying rex.ctl_demo.
    Validating rex.ctl_demo.
    # Total time: ...
    Done.

You may be able to silence non-error output from a command if you enable quiet
mode::

    >>> ctl("hello Billy")
    Hello, Billy!
    >>> ctl("hello Billy --quiet")


Using ``Ctl`` interface
=======================

For testing ``rex`` tasks, you can use ``Ctl`` interface.  The ``Ctl`` constructor
takes a list or a string of command-line parameters.  For example, to run ``rex help``
task, you can write::

    >>> help_ctl = Ctl("help")
    >>> help_ctl
    Ctl('help')

    >>> output = help_ctl.wait()
    >>> print(output)                # doctest: +ELLIPSIS
    Rex - Command-line administration utility for the RexDB platform
    Usage: rex [@instance] [<settings>...] <task> [<arguments>...]
    <BLANKLINE>
    Run rex help for general usage and a list of tasks,
    settings and other help topics.
    ...

As a shortcut, you can write::

    >>> print(ctl("help"))           # doctest: +ELLIPSIS
    Rex - Command-line administration utility for the RexDB platform
    ...

If the task fails, an exception is raised::

    >>> print(ctl("undefined"))                  # doctest: +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
      ...
    rex.core.Error: Received unexpected exit code:
        expected 0; got 1
    With output:
        FATAL ERROR: unknown task undefined
    From:
        rex undefined

You can allow the task to return a non-zero exit code by supplying ``expect``
parameter::

    >>> ctl("undefined", expect=1)              # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: unknown task undefined

You can start a long-running process too.  For example, you can start the
development HTTP server::

    >>> import random
    >>> random_port = random.randrange(8000, 9000)

    >>> serve_ctl = Ctl("serve rex.ctl_demo --port=%s" % random_port)

You can now make a query::

    >>> import urllib.request, urllib.parse, urllib.error
    >>> output = None
    >>> import time
    >>> time.sleep(10)
    >>> while not output:
    ...     try: output = urllib.request.urlopen('http://127.0.0.1:%s/' % random_port)
    ...     except IOError: pass
    >>> print(output.read().decode('utf-8'))
    <!DOCTYPE html>
    <title>Welcome to REX.CTL_DEMO!</title>

To stop the server, use ``rex.ctl.Ctl.stop()``::

    >>> print(serve_ctl.stop())                  # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Serving rex.ctl_demo on 127.0.0.1:8...
    ... - - [...] "GET / HTTP/1.1" 200 55


Documentation
=============

``rex.ctl`` can generate documentation for available commands.  To get
a list of documentation entries, write::

    >>> from rex.ctl import Task

    >>> entries = Task.document_all()

    >>> for entry in entries:
    ...     print(entry.index)
    help
    packages
    pyshell
    settings


