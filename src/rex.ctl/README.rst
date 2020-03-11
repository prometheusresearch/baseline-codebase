*****************************
  REX.CTL Programming Guide
*****************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: meth(literal)
.. role:: attr(literal)
.. role:: func(literal)


Overview
========

This package provides the ``rex`` command-line utility.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute
Of Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Getting help
============

.. highlight:: console

The ``rex`` utility provides a command-line interface for RexDB applications.
All invocations of the ``rex`` utility follow the same pattern::

    $ rex <task> [<arguments>...]

Parameter ``<task>`` indicates the action to perform, ``<arguments>...`` are
parameters specific to the action.  One of the most useful tasks is ``rex
help``, which lists available tasks, settings and help topics::

    $ rex help
    Rex - Command-line administration utility for the RexDB platform
    Usage: rex [<settings>...] <task> [<arguments>...]

    Run rex help for general usage and a list of tasks,
    settings and other help topics.
    ...

To describe a specific task, pass the task name as a parameter to ``rex help``;
for example::

    $ rex help serve
    SERVE - starts HTTP server
    Usage: rex serve [<project>]

    The serve task starts an HTTP server to serve a RexDB application.
    ...

You can also use ``rex help`` to describe a global setting::

    $ rex help debug
    DEBUG - print debug information
    Usage: rex --debug
           debug: true (rex.yaml)
           REX_DEBUG=1 (environment)


Using and configuring ``rex`` utility
=====================================

To productively use the ``rex`` utility with a RexDB application, you need to
configure the application.  To do so, create file ``rex.yaml`` in the current
directory.  The file may contain the application name, the application
configuration and other global parameters.

.. highlight:: yaml

For example, create ``rex.yaml`` with the following content::

    project: rex.ctl_demo
    parameters:
        db: pgsql:ctl_demo
    http-host: localhost
    http-port: 8088

.. highlight:: console

Now you can use ``rex`` to perform various tasks on the :mod:`rex.ctl_demo`
application.   For example, to deploy the application database and start a
development HTTP server with the application, run::

    $ rex deploy
    Deploying application database to pgsql:///ctl_demo.
    Deploying rex.ctl_demo.
    Validating rex.ctl_demo.
    Done.

    $ rex serve
    Serving rex.ctl_demo on localhost:8088

If you wish to name the configuration file differently, or the file is not in
the current directory, you can use ``--config`` parameter to specify the
location of the configuration file::

    $ rex deploy --config=/path/to/rex.yaml
    ...

    $ rex serve --config=/path/to/rex.yaml
    ...

Alternatively, configuration parameters could be specified using environment
variables::

    $ export REX_PROJECT=rex.ctl_demo
    $ export REX_PARAMETERS='{"db": "pgsql:ctl_demo"}'
    $ export REX_HTTP_HOST=localhost
    $ export REX_HTTP_PORT=8088

    $ rex deploy
    ...

    $ rex serve
    ...

Another option is to specify the application name and configuration using
command-line parameters::

    $ rex deploy --project rex.ctl_demo --set db=pgsql:ctl_demo
    ...

    $ rex serve --project rex.ctl_demo --set db=pgsql:ctl_demo -h localhost -p 8088
    ...

To get a list of all configuration parameters supported by the application, use
``rex setting`` task, e.g.::

    $ rex settings --project rex.ctl_demo
    access:
    db*:
      'pgsql:ctl_demo'
    debug:
    gateways:
    ...

    $ rex settings --project rex.ctl_demo --verbose
    [access]
    Declared in:
      rex.web
    Description:
      Access table with permissions required to access package resources.
    ...

To get a list of all packages that constitute the application, use ``rex
packages`` task, e.g.::

    $ rex packages --project rex.ctl_demo
    rex.ctl_demo == 1.7.0
    rex.port == 1.0.2
    rex.deploy == 2.0.0
    rex.db == 3.0.0
    ...

    $ rex packages --project rex.ctl_demo --verbose
    [rex.ctl_demo]
    Version:
      1.7.0
    Location:
      /home/xi/prometheus/rex/rex.ctl/demo/src
    ...

.. highlight:: console

To interact with the application from Python shell, use ``rex pyshell`` task,
e.g.::

    $ rex pyshell --project rex.ctl_demo
    Type 'help' for more information, Ctrl-D to exit.

.. highlight:: python

::

    >>> ctl_demo
    LatentRex('rex.ctl_demo')
    >>> from rex.db import get_db
    >>> for user in get_db().produce('/user'):
    ...     print(user)
    ... 
    user(code=u'alice@rexdb.com', name=u'Alice Amter', enabled=True)
    user(code=u'bob@rexdb.com', name=u'Bob Barker', enabled=False)
    user(code=u'carol@rexdb.com', name=u'Carol Costello', enabled=True)
    >>>


Creating tasks
==============

.. highlight:: console

To add a ``rex`` task, you need to define a subclass of :class:`rex.ctl.Task`
class.  For example, :mod:`rex.ctl_demo` defines a simple task ``hello``, which
greets the user that runs it::

    $ rex hello world
    Hello, World!

    $ rex hello
    Hello, Alice!

    $ rex help hello
    HELLO - greet someone
    Usage: rex hello [<name>]

    Run rex hello to greet the current user.  Alternatively,
    run rex hello <name> to greet the specified user.

.. highlight:: python

Here is the task definition from ``rex/ctl_demo/ctl.py``::

    from rex.ctl import Task, argument
    import os

    class HelloTask(Task):
        """greet someone

        Run `rex hello` to greet the current user.  Alternatively,
        run `rex hello <name>` to greet the specified user.
        """

        name = 'hello'

        class arguments:
            name = argument(default=None)

        def __call__(self):
            name = self.name or os.environ['USER']
            print "Hello, %s!" % name.capitalize()

To define a task, we need to specify the task name, its arguments and optional
parameters, write the task description and the code to execute when the task is
invoked.

Class attribute :attr:`rex.ctl.Task.name` specifies the task name.  Task
arguments are defined as attributes of a nested class ``arguments``.  Task
description for ``rex help`` command is derived from the class docstring.
When the task is invoked, ``rex`` executes the :meth:`rex.ctl.Task.__call__`
method of the class.  The value of the parameter is stored as an attribute
on the task instance.

To let the ``rex`` utility find the task definition, add an entry point
``rex.ctl`` to the package's ``setup.py`` file.  For ``rex.ctl_demo`` package,
we add::

    setup(
        name='rex.ctl_demo',
        [...]
        entry_points={'rex.ctl': ['rex = rex.ctl_demo']},
        [...]
    )


Optional parameters
===================

Many ``rex`` tasks accept optional parameters, or *options*.  You can define a
task option using the ``options`` container; here is an example::

    from rex.ctl import Task, argument, option
    import sys
    import os

    class WriteHelloTask(Task):

        name = 'write-hello'

        class arguments:
            name = argument(default=None)

        class options:
            output = option('o', default=None)

        def __call__(self):
            name = self.name or os.environ['USER']
            stream = (open(self.output, 'w')
                      if self.output is not None else sys.stdout)
            stream.write("Hello, %s!\n" % name.capitalize())

.. highlight:: console

The task ``rex write-hello`` has a single option ``--output`` that lets you
specify the name of the file where the task writes the greeting.  You can use
either a long form (``--output``) or a short form (``-o``) or you could omit
the option entirely.  For example::

    $ rex write-hello --output=hello.txt
    $ cat hello.txt
    Hello, Alice!

    $ rex write-hello -o hello.txt
    $ cat hello.txt
    Hello, Alice!

    $ rex write-hello
    Hello, Alice!

.. highlight:: python

You can also define a global option, which is visible for all tasks.  Let's
define an option ``default-hello-name`` that could be used by a greeting task
when the user omits the name.  Here is its definition from
``rex/ctl_demo/ctl.py``::

    from rex.ctl import Global
    import os

    class DefaultHelloNameGlobal(Global):
        """the name to use for greetings (if not set: login name)"""

        name = 'default-hello-name'
        default = os.environ['USER']

Values of global options are stored as attributes of a global object ``env``.
For example, ``env.default_hello_name`` keeps the value of the
``default-hello-name`` option.

Here is an example of a command that uses a global option::

    from rex.ctl import Task, argument, env

    class GlobalHelloTask(Task):

        name = 'global-hello'

        class arguments:
            name = argument(default=None)

        def __call__(self):
            name = self.name or env.default_hello_name
            print "Hello, %s!" % name.capitalize()

.. highlight:: console

There are several ways you could pass a value of a global option to ``rex``.
You can add it as a command-line parameter::

    $ rex --default-hello-name=world global-hello
    Hello, World!

Anternatively you can pass it using an environment variable::

    $ export REX_DEFAULT_HELLO_NAME=world
    $ rex global-hello
    Hello, World!

.. highlight:: yaml

Finally, you can put a global option to a configuration file ``rex.yaml``::

    default-hello-name: world

.. highlight:: console

Then run ``rex`` in the same directory::

    $ rex global-hello
    Hello, World!


Arguments and options
=====================

We use :class:`rex.ctl.argument` and :class:`rex.ctl.option` to define task
parameters.  The :class:`rex.ctl.argument` descriptor accepts the following
arguments:

``check``
    A function called to validate and transform the value of the argument.
    The function must return the transformed value or raise ``ValueError``
    exception on error.
``default``
    The default value of the argument.  If not specified, the argument
    is considered mandatory.
``plural``
    If set, the argument may consume more than one command-line parameters.

The :class:`rex.ctl.option` descriptor accepts the following arguments:

``key``
    A one-character shorthand.
``check``
    A function called to validate and transform the value of the argument.
    The function must return the transformed value or raise ``ValueError``
    exception on error.
``default``
    The default value of the option.  If not specified, the option is treated
    as a toggle and does not accept a value.  A toggle option produces ``True``
    ``True`` when it is provided and ``False`` when it's not provided.
``plural``
    If set, indicates that the option could be provided more than once.
``value_name``
    The name of the option value; used by ``rex help``.
``hint``
    A one-line description of the option; used by ``rex help``.


Working with RexDB projects
===========================

.. highlight:: console

To define an application-specific task, inherit the task class from
:class:`rex.ctl.RexTask`.  :class:`rex.ctl.RexTask` defines standard arguments
and options for configuring a RexDB application and lets you easily generate an
application instance.

For example, :mod:`rex.ctl_demo` project needs to provide a way to initialize
the database as well as to list, add, enable and disable application users.
The user manipulation actions are implemented as a Python API, but we need to
expose them through a command-line interface.

We define tasks:

``rex demo-init``
    Initializes the application database and adds some default users.

``rex demo-cron``
    Runs an ETL script that could be started periodically from a CRON job.

``rex demo-user-list``
    Lists all users in the database.

``rex demo-user-add``
    Adds a new user to the database.

``rex demo-user-enable``
    Enables an existing user in the database.

``rex demo-user-disable``
    Disables an existing user in the database.

Let us show how they work::

    $ export REX_PROJECT=rex.ctl_demo

    $ rex demo-init
    Creating database pgsql:///ctl_demo.
    Deploying application database to pgsql:///ctl_demo.
    Deploying rex.ctl_demo.
    Validating rex.ctl_demo.
    Done.
    Added user: alice@rexdb.com
    Added user: bob@rexdb.com

    $ rex demo-user-list
    Alice Amter (alice@rexdb.com)
    Bob Barker (bob@rexdb.com)

    $ rex demo-user-add carol@rexdb.com "Carol Costello"
    Added user: carol@rexdb.com

    $ rex demo-user-list
    Alice Amter (alice@rexdb.com)
    Bob Barker (bob@rexdb.com)
    Carol Costello (carol@rexdb.com)

    $ rex demo-user-disable bob@rexdb.com
    Disabled user: bob@rexdb.com

    $ rex demo-user-list
    Alice Amter (alice@rexdb.com)
    Bob Barker (bob@rexdb.com) [disabled]
    Carol Costello (carol@rexdb.com)

If we need to execute a particular task periodically, we could add it
as a cron job::

    $ crontab -l
    REX_PROJECT = rex.ctl_demo
    0 5 * * * rex demo-cron

The application detects and reports user errors::

    $ rex demo-user-add alice@rexdb.com "Alice Zhang"
    FATAL ERROR: User already exists:
        alice@rexdb.com

    $ rex demo-user-disable dave@rexdb.com
    FATAL ERROR: User does not exist:
        dave@rexdb.com

.. highlight:: python

We start with implementing ``rex demo-user-list`` task, which takes no
arguments or options::

    from rex.ctl import RexTask, log
    from .user import Users

    class UserListTask(RexTask):
        """list all users"""

        name = 'demo-user-list'

        def __call__(self):
            with self.make():
                for user in Users():
                    if user.enabled:
                        log("{} (`{}`)", user.name, user.code)
                    else:
                        log("{} ({}) [disabled]", user.name, user.code)

To generate an application instance, we call method
:meth:`rex.ctl.RexTask.make()`.  We activate the instance using ``with`` clause
and invoke internal application API to get a list of users.  The utility
function :func:`rex.ctl.log()` is used to display output and to add some
highlighting.

Next, let's review ``rex demo-init`` task::

    class InitTask(RexTask):
        """initialize the database"""

        name = 'demo-init'

        def __call__(self):
            self.do('deploy')
            self.do('demo-user-add', code='alice@rexdb.com', name="Alice Amter")
            self.do('demo-user-add', code='bob@rexdb.com', name="Bob Barker")

The ``rex demo-init`` task is implemented entirely in terms of other tasks:
``rex deploy`` and ``rex demo-user-add``.  We use :meth:`rex.ctl.RexTask.do()`
to invoke a subtask, passing values for arguments and options as keyword
parameters.  Note that if the task itself and a subtask have a parameter with
the same name, the parameter value is passed from the task to its subtask.

.. highlight:: console

We use the same approach to implement ``rex demo-cron`` task.  We wish to
create an equivalent of the following command-line command::

    $ rex query -i rex.ctl_demo:/etl/disable-bots.htsql -i rex.ctl_demo:/etl/delete-spammers.htsql

.. highlight:: python

Presumably, ``disable-bots.htsql`` and ``delete-spammers.htsql`` are HTSQL
scripts that we want to execute in the same transaction to perform some ETL
task.  Using :meth:`rex.ctl.RexTask.do()`, we can invoke this command as
follows::

    class CronTask(RexTask):
        """run an ETL job"""

        name = 'demo-cron'

        def __call__(self):
            self.do('query',
                    input=[
                        'rex.ctl_demo:/etl/disable-bots.htsql',
                        'rex.ctl_demo:/etl/delete-spammers.htsql'])

Finally, let's look at ``rex demo-user-add``::

    class UserAddTask(RexTask):
        """add a new user"""

        name = 'demo-user-add'

        class arguments:
            code = argument()
            name = argument()

        class options:
            disabled = option(hint="disable the new user")

        def __call__(self):
            with self.make():
                users = Users()
                users.add(self.code, self.name, not self.disabled)
                log("Added user: `{}`", self.code)

This task has two arguments ``<code>`` and ``<name>`` and a toggle
``--disabled``.  Their values are stored as attributes ``self.code``,
``self.name`` and ``self.disabled`` on the task instance.

