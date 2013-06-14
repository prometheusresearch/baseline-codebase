***********************************************************************
  REX.CTL -- Command-line administration utility for the Rex platform
***********************************************************************

.. contents:: Table of Contents


Overview
========

This package provides the ``rex`` command-line utility.

This package is a part of the RexDB platform for medical research data
management.  It is created by Prometheus Research, LLC and released under
AGPLv3 license.


Getting help
============

All invocations of the ``rex`` utility follows the same pattern::

    $ rex <task> [<arguments>...]

Parameter ``<task>`` indicates the action to perform, ``<arguments>...`` are
parameters specific to the action.  One of the most useful tasks is called
``help``, and it allows you to list available tasks, settings and help topics::

    $ rex help
    Rex - Command-line administration utility for the Rex platform
    Usage: rex [<settings>...] <task> [<arguments>...]

    Run rex help for general usage and a list of tasks,
    settings and other help topics.

    ...

To describe a specific task, pass the task name as a parameter to ``help``, for
example::

    $ rex help serve
    SERVE - starts HTTP server
    Usage: rex serve [<project>]

    The serve task starts an HTTP server to serve a Rex application.

    ...

You can also use ``help`` to describe a global setting::

    $ rex help debug
    DEBUG - print debug information
    Usage: rex --debug
           debug: true (rex.yaml)
           REX_DEBUG=1 (environment)


Starting HTTP server
====================

Use task ``serve`` to serve a Rex application via HTTP::

    $ rex serve rex.ctl_demo
    Serving rex.ctl_demo on localhost:8088

Press ``Ctrl-C`` to stop the server.

You can use options ``--host`` and ``--port`` to override the address
of the HTTP server::

    $ rex serve rex.ctl_demo --host localhost --port 8088
    Serving rex.ctl_demo on localhost:8088

Use option ``--set`` to specify an application parameter::

    $ rex serve rex.ctl_demo --set hello_role=anybody


Configuration file
==================

You can specify the project name, application configuration and other
parameters in a configuration file.  Create a file ``rex.yaml`` with
the following content::

    project: rex.ctl_demo
    parameters:
        hello_role: anybody
    http-host: localhost
    http-port: 8088

Now you can start the ``serve`` task with no arguments at all::

    $ rex serve
    Serving rex.ctl_demo on localhost:8088


Packages and settings
=====================

To list the packages that compose the Rex application, run::

    $ rex help packages
    [rex.ctl_demo]
    Version:
      1.0.0
    ...

To list all configuration parameters of the application, run::

    $ rex help settings
    [debug]
    Declared in:
      rex.core
    Description:
      Turn on debug mode.

    ...


