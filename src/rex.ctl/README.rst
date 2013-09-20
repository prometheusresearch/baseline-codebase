***********************
  REX.CTL Usage Guide
***********************

.. contents:: Table of Contents


Overview
========

This package provides the ``rex`` command-line utility.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

.. |R| unicode:: 0xAE .. registered trademark sign


Getting help
============

All invocations of the ``rex`` utility follow the same pattern::

    $ rex <task> [<arguments>...]

Parameter ``<task>`` indicates the action to perform, ``<arguments>...`` are
parameters specific to the action.  One of the most useful tasks is ``rex
help``, which allows you to list available tasks, settings and help topics::

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


Starting HTTP server
====================

Use ``rex serve`` to serve a RexDB application via HTTP::

    $ rex serve rex.ctl_demo
    Serving rex.ctl_demo on localhost:8088

Press ``Ctrl-C`` to stop the server.

You can use options ``--host`` and ``--port`` to override the address of the
HTTP server::

    $ rex serve rex.ctl_demo --host localhost --port 8088
    Serving rex.ctl_demo on localhost:8088

Use option ``--set`` to specify a parameter of the application::

    $ rex serve rex.ctl_demo --set hello_access=anybody


Configuration file
==================

You can specify the project name, application configuration and other
parameters in a configuration file.  For example, create a file ``rex.yaml``
with the following content::

    project: rex.ctl_demo
    parameters:
        hello_access: anybody
    http-host: localhost
    http-port: 8088

Now you can start ``rex serve`` with no arguments at all::

    $ rex serve
    Serving rex.ctl_demo on localhost:8088

Alternatively, configuration parameters could be specified using environment
variables::

    $ export REX_PROJECT=rex.ctl_demo
    $ export REX_PARAMETERS='{"hello_access": "anybody"}'
    $ export REX_HTTP_HOST=localhost
    $ export REX_HTTP_PORT=8088
    $ rex serve
    Serving rex.ctl_demo on localhost:8088

or command-line parameters::

    $ rex serve --project=rex.ctl_demo \
                --parameters='{"hello_access": "anybody"}' \
                --http-host=localhost \
                --http-port=8088
    Serving rex.ctl_demo on localhost:8088


WSGI scripts
============

For running a RexDB application in production, the built-in HTTP server ``rex
serve`` may not be the best choice.  Instead, you can use one of the industry
standard tools such as mod_wsgi_, uwsgi_, or Gunicorn_.

.. _mod_wsgi: http://code.google.com/p/modwsgi/
.. _uwsgi: http://uwsgi-docs.readthedocs.org/
.. _Gunicorn: http://gunicorn.org/

To serve a Python application, these tools require you to create a *WSGI
script*, a small Python program that creates and configures an application
object.  Use ``rex wsgi`` for that purpose::

    $ rex wsgi rex.ctl_demo -o ctl_demo.wsgi

This commands generates a WSGI script for ``rex.ctl_demo`` and saves it as
``ctl_demo.wsgi``.


Database management
===================

If the RexDB application uses ``rex.db`` and ``rex.deploy`` packages
to manage and access a database, you can use ``rex`` to perform various
database-related tasks.

To deploy the application database, use ``rex deploy``::

    $ rex deploy rex.ctl_demo
    deploying database schema to pgsql:///ctl_demo

To open HTSQL shell to the application database, use ``rex shell``::

    $ rex shell rex.ctl_demo
    Type 'help' for more information, 'exit' to quit the shell.
    ctl_demo$


Packages and settings
=====================

To list the packages that compose the RexDB application, run::

    $ rex packages rex.ctl_demo
    [rex.ctl_demo]
    Version:
      1.0.0
    ...

To list all configuration parameters of the application, run::

    $ rex settings rex.ctl_demo
    [debug]
    Declared in:
      rex.core
    Description:
      Turn on debug mode.
    ...


