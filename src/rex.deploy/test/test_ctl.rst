**************************
  Command-line Interface
**************************

.. contents:: Table of Contents


``rex createdb``, ``rex dropdb``
================================

To create and delete the application database, you can use commands ``rex
createdb`` and ``rex dropdb``::

    >>> import os
    >>> os.environ['REX_PROJECT'] = 'rex.deploy_demo'
    >>> os.environ['REX_PARAMETERS'] = '{"db": "pgsql:deploy_demo_ctl"}'

    >>> from rex.ctl import ctl

    >>> ctl("createdb")
    Creating database pgsql:///deploy_demo_ctl.

    >>> ctl("createdb")
    Database pgsql:///deploy_demo_ctl already exists.

    >>> ctl("dropdb")
    Dropping database pgsql:///deploy_demo_ctl.

    >>> ctl("dropdb")
    Database pgsql:///deploy_demo_ctl does not exist.

Use option ``--quiet`` to suppress the message::

    >>> ctl("createdb --quiet")

    >>> ctl("createdb --quiet")

    >>> ctl("dropdb --quiet")

    >>> ctl("dropdb --quiet")


``rex dumpdb``, ``rex loaddb``
==============================

Use command ``rex dumpdb`` to dump a copy of the database in SQL format::

    >>> ctl("createdb --quiet")

    >>> ctl("dumpdb")               # doctest: +ELLIPSIS
    --
    -- PostgreSQL database dump
    --
    ...

You can also save the output to a file::

    >>> ctl("dumpdb -o ./build/sandbox/deploy_demo_ctl.sql")

    >>> print(open('./build/sandbox/deploy_demo_ctl.sql').read())    # doctest: +ELLIPSIS
    --
    -- PostgreSQL database dump
    --
    ...

It is an error to dump a non-existent database::

    >>> ctl("dropdb --quiet")

    >>> ctl("dumpdb", expect=1)     # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: database pgsql:///deploy_demo_ctl does not exist

However you can create a database from a dump::

    >>> ctl("loaddb -i ./build/sandbox/deploy_demo_ctl.sql")
    Creating database pgsql:///deploy_demo_ctl.

    >>> ctl("dropdb --quiet")


``rex deploy``
==============

Use ``rex deploy`` to install the application database::

    >>> ctl("deploy")
    Creating database pgsql:///deploy_demo_ctl.
    Deploying application database to pgsql:///deploy_demo_ctl.
    Deploying rex.deploy_demo.
    Validating rex.deploy_demo.
    Done.

Add ``--quiet`` to suppress the output::

    >>> ctl("deploy --quiet")

    >>> ctl("dropdb --quiet")



