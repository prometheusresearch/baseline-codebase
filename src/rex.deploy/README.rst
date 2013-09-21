********************************
  REX.DEPLOY Programming Guide
********************************

.. contents:: Table of Contents


Overview
========

This package provides database schema management for the Rex platform.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

.. |R| unicode:: 0xAE .. registered trademark sign


Schema definition
=================

A package that uses ``rex.deploy`` can define a schema definition file:
``/static/deploy.yaml``.  This file contains a collection of statements
about the database.  For example::

    - table: measure

Each statement encodes some fact about the database.  This particular statement
reads as: *The database has a table called measure*.

When ``rex.deploy`` reads this statement, it checks if there is a table
called ``measure`` in the database.  If there is, nothing happens.
Otherwise, ``rex.deploy`` creates the table.  In any case, the end result
is that this statement becomes true.

Similarly, we could define a column::

    - column: measure.date_of_evaluation
      type: date

If the column does not exist, it is created.  If the column does exist,
but of a different type, ``rex.deploy`` will attempt to convert the column
to the correct data type.  Finally, if the column already exists and
is of the right type, nothing happens.

The last part is important because it allows us to apply the same statement
again and again safely.


Invocation
==========

Install package ``rex.ctl`` alongside with ``rex.deploy`` to deploy
the application database.  Use ``rex deploy`` command to deploy
the database::

    $ rex deploy rex.deploy_demo


