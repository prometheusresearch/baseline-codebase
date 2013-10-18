********************************
  REX.DEPLOY Programming Guide
********************************

.. contents:: Table of Contents
.. role:: mod(literal)


Overview
========

This package provides database schema management for the Rex platform.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute
Of Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Getting started
===============

:mod:`rex.deploy` is a database schema management system.  It allows you
to describe and deploy the application database.

Suppose you make a RexDB application for managing medical research.  This
application stores information about studies, research subjects, assessments
in a PostgreSQL database.  The application uses :mod:`rex.deploy` to
describe the structure of the database.

The database schema of the application is described in a static resource
``deploy.yaml``.  For instance, application :mod:`rex.deploy_demo` describes
its schema in file ``rex.deploy_demo/static/deploy.yaml``::

    - table: study
    - column: study.code
      type: text
    - identity: [study.code]
    ...

This file is in YAML format.  It contains a sequence of statements, or *facts*,
describing the structure of the database.  The first fact is::

    - table: study

It is translated to English as:

    The database contains a table called *study*.

The next fact is::

    - column: study.code
      type: text

can be interpreted as:

    Table *study* has a column called *code* of type *text*.

The third fact::

    - identity: [study.code]

means:

    Records of table *study* are uniquely identified by column *code*.

When you deploy the application schema, :mod:`rex.deploy` reads each fact and
ensures that it holds true.  To do so, :mod:`rex.deploy` may modify the
database.  For example, if you deploy :mod:`rex.deploy_demo` schema from
scratch, :mod:`rex.deploy` will:

1. Create table ``study``.
2. Add column ``code`` to table ``study``.
3. Make ``code`` the primary key of table ``study``.

On the other hand, if you deploy the same schema over the same database
instance again, :mod:`rex.deploy` will realize that all the facts are already
satisfied and will leave the database intact.


Deploying the schema
====================

We use the ``rex`` command-line tool from package :mod:`rex.ctl` to deploy
application schema.  For example, to deploy the schema for
:mod:`rex.deploy_demo` application, run::

    $ rex deploy rex.deploy_demo --set db=pgsql:deploy_demo

You can also store the application name and parameters in a configuration file
``rex.yaml``::

    project: rex.deploy_demo
    settings:
      db: pgsql:deploy_demo

If the ``rex.yaml`` file exists in the current directory, you can run

    $ rex deploy

to deploy the application database.

For more information on the ``rex`` utility and ``rex.yaml`` configuration
file, see documentation to :mod:`rex.ctl`.


Cluster management
==================

:mod:`rex.deploy` allows you to manage databases in a PostgreSQL cluster.  Use
function :func:`rex.deploy.get_cluster` to get a :class:`rex.deploy.Cluster`
instance associated with the application database::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.deploy_demo')

    >>> from rex.deploy import get_cluster
    >>> with demo:
    ...     cluster = get_cluster()

Using :class:`rex.deploy.Cluster`, you can create and destroy databases in the
cluster::

    >>> cluster.create('deploy_demo_derived')
    >>> cluster.exists('deploy_demo_derived')
    True

    >>> cluster.drop('deploy_demo_derived')
    >>> cluster.exists('deploy_demo_derived')
    False

Use function :func:`rex.deploy.introspect` to get a catalog image that reflects
the structure of the database::

    >>> from rex.deploy import introspect

    >>> connection = cluster.connect()
    >>> catalog = introspect(connection)


SQL serialization
=================

:mod:`rex.deploy` contains a number of functions for building SQL commands.
For example, :func:`rex.deploy.sql_create_table` generates a ``CREATE TABLE``
statemement.  This function takes two arguments: the table name and a list of
definitions for the body of the statement.  To populate the body with column
definitions, you can use func:`rex.deploy.sql_define_column`::

    >>> from rex.deploy import sql_create_table, sql_define_column

    >>> body = [
    ...     sql_define_column(u'id', u'serial4', True),
    ...     sql_define_column(u'code', (u'varchar', 8), True),
    ...     sql_define_column(u'title', u'text', False),
    ... ]
    >>> print sql_create_table(u'study', body)
    CREATE TABLE "study" (
        "id" "serial4" NOT NULL,
        "code" "varchar"(8) NOT NULL,
        "title" "text"
    );

Many common DDL and CRUD expressions are supported.

:mod:`rex.deploy` also provides a :func:`rex.deploy.mangle` utility for
generating a valid SQL name from a list of fragments and an optional suffix::

    >>> from rex.deploy import mangle

    >>> mangle([u'individual', u'mother'], u'fk')
    u'individual_mother_fk'


