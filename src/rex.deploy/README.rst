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
    parameters:
      db: pgsql:deploy_demo

If the ``rex.yaml`` file exists in the current directory, you can run

    $ rex deploy

to deploy the application database.

For more information on the ``rex`` utility and ``rex.yaml`` configuration
file, see documentation to :mod:`rex.ctl`.


Table fact
==========

A table fact describes a database table.

`table`: ``<label>``
    The name of the table.

`was`: ``<former_label>`` *(TODO)*
    The previous name of the table.

`present`: ``true`` (default) or ``false``
    Indicates whether the table exists in thee database.

`with`: [...]
    List of facts related to the table.  Facts listed here have their ``of``
    clauses automatically assigned to the name of the table.

    This clause cannot be set if ``present`` is ``false``.

Deploying when ``present`` is ``true``:

    Ensures that the database has a table called ``<label>``.  If the table
    does not exist, it is created.

    The table must have a surrogate key column ``id``.  It is created
    automatically when the table is created.

    All related facts from the ``with`` clause are deployed as well.

Deploying when ``present`` is ``false``:

    Ensures that the database has no table ``<label>``.  If a table with this
    name exists, it is deleted.

    Any links to the table (except for self links) will prevent the table from
    being deleted. *(FIXME?)*

Examples:

    #. Adding a new table::

        table: individual

    #. Removing a table::

        table: family
        present: false

    #. *(TODO)* Renaming or creating a table::

        table: instrument
        was: measure_type

       If the database has no table ``instrument``, but there is a table
       ``measure_type``, the table is renamed to ``instrument``.  Otherwise, a
       new table is created.

    #. Adding a table with related facts::

        table: protocol
        with:
        - link: study
        - column: code
          type: text
        - identity: [study, code]
        - column: title
          type: text

       This example could be equivalently written as a series of independent
       facts::

        - table: protocol
        - link: study
          of: protocol
        - column: code
          of: protocol
          type: text
        - identity: [study, code]
          of: protocol
        - column: title
          of: protocol
          type: text


Column fact
===========

A column fact describes a column of a table.

`column`: ``<label>`` or ``<table_label>.<label>``
    The name of the column *or* the names of the table and the column separated
    by a period.

`of`: ``<table_label>``
    The name of the table.

    You don't need to specify this clause if the table name is set in the
    ``column`` clause or if the column is defined in a ``with`` clause of a
    table fact.

`present`: ``true`` (default) or ``false``
    Indicates whether the column exists in the table.

`type`: ``<type_label>`` or [``<enum_label>``]
    The type of the column.  Valid types: *boolean*, *integer*, *decimal*,
    *float*, *text*, *date*, *time*, *datetime*.

    If the column has an ``ENUM`` type, specify a list of ``ENUM`` labels.

    This clause cannot be used if ``present`` is ``false``.

`required`: ``true`` (default) or ``false``
    Indicates whether or not the column forbids ``NULL`` values.

    This clause cannot be used if ``present`` is ``false``.

Deploying when ``present`` is ``true``:

    Ensures that table ``<table_label>`` has a column ``<label>`` of type
    ``<table_label>``.  If the column does not exist, it is created.

    If ``required`` is set to ``true``, which is the default, the column
    should have a ``NOT NULL`` constraint.

    *(TODO)* If the column exists, but does not match the description,
    it is converted to match the description when possible.

    It is an error if table ``<table_label>`` does not exist.

Deploying when ``present`` is ``false``:

    Ensures that ``<table_label>`` does not have column ``<label>``.  If such a
    column exists, it is deleted.

    It is *not* an error if table ``<table_label>`` does not exist.

Examples:

    #. Adding a column to a table::

        column: title
        of: study
        type: text

       This example can also be written as follows::

        column: study.title
        type: text

       When the column is defined within a ``with`` clause, ``of`` could be
       omitted::

        table: study
        with:
        - column: title
          type: text

    #. Removing a column::

        column: title
        of: study
        present: false

    #. Adding an ``ENUM`` column::

        column: sex
        of: individual
        type: [male, female, intersex]

    #. Adding a column that permits ``NULL`` values::

        column: middle_name
        of: identity
        type: text
        required: false


Link fact
=========

A link fact describes a link between two tables.

`link`: ``<label>`` or ``<table_label>.<label>``
    The name of the link *or* the names of the origin table and the link
    separated by a period.

`of`: ``<table_label>``
    The name of the origin table.

    You don't need to specify this clause if the table name is set in the
    ``link`` clause or if the link is defined in a ``with`` clause of a table
    fact.

`present`: ``true`` (default) or ``false``
    Indicates whether the link exists.

`to`: ``<target_table_label>``
    The name of the target table.

    You don't need to specify the name of the target table if it coincides with
    the name of the link.

    This clause cannot be used if ``present`` is ``false``.

`required`: ``true`` (default) or ``false``
    Indicates whether or not the link forbids ``NULL`` values.

    This clause cannot be used if ``present`` is ``false``.

Deploying when ``present`` is ``true``:

    Ensures that table ``<table_label>`` has column ``<label>_id`` and a
    ``FOREIGN KEY`` constraint from ``<table_label>.<label>_id`` to
    ``<target_table_label>.id``.  If the column and the constraint do not
    exist, they are created.

    If ``required`` is set to ``true`` (default), the column should have
    a ``NOT NULL`` constraint.

    It is an error if either ``<table_label>`` or ``<target_table_label>``
    tables do not exist.

Deploying when ``present`` is ``false``:

    Ensures that table ``<table_label>`` does not have column ``<label>_id``.
    If such a column exists, it is deleted.

    It is *not* an error if table ``<table_label>`` does not exist.

Examples:

    #. Adding a link between two tables::

        link: individual
        of: sample
        to: individual

       Since the name of the link and the name of the target table are the
       same, the ``to`` clause could be omitted::

        link: individual
        of: sample

       The name of the origin table could be specified in the ``link`` clause::

        link: sample.individual

       When the link is defined within a ``with`` clause, the table name could
       be omitted::

        table: sample
        with:
        - link: individual

    #. Removing a link::

        link: individual
        of: sample
        present: false

    #. Adding a link that permits ``NULL`` values::

        link: originating_study
        of: measure
        to: study
        required: false

    #. Adding a self-referential link::

        link: mother
        of: individual
        to: individual
        required: false

       Note that a self-referential link must allow ``NULL`` values.


Identity fact
=============

Identity fact describes identity of a table.

Table identity is a set of table columns and links which could uniquely
identify every row in the table.

`identity`: [``<label>`` or ``<table_label>.<label>``]
    Names of columns and links that form the table identity.

    Each name may include the table name separated by a period.

`of`: ``<table_label>``
    The name of the table.

    You don't need to specify this clause if the table name is set in the
    ``identity`` clause or if the identity is defined in a ``with`` clause of a
    table fact.

Deploying:

    Ensures that table ``<table_label>`` has a ``PRIMARY KEY`` constraint on
    the given columns.  If the constraint does not exist, it is created.

    If the table already has a ``PRIMARY KEY`` constraint on a different set of
    columns, the old constraint is deleted and the new one is added.

    It is an error if table ``<table_label>`` or any of the columns do not
    exist.

Examples:

    #. Creating a table identity::

        identity: [case, individual]
        of: participation

       The name of the table could also be specified in the identity clause::

        identity: [participation.case, participation.individual]

       If the identity is defined in the ``with`` clause, the table name could
       be omitted::

        table: participation
        with:
        - link: case
        - link: individual
        - identity: [case, individual]

    #. Creating a *trunk* table::

        table: individual
        with:
        - column: code
          type: text
        - identity: [code]

       A trunk table is a table which identity does not depend on other tables.
       Identity of a trunk table does not contain links to other tables.

    #. Creating a *facet* table::

        table: identity
        with:
        - link: individual
        - identity: [individual]

       A facet table has a *one-to-one* relationship with its parent table.
       Its identity consists of the link to the parent table.

    #. Creating a *branch* table::

        table: protocol
        with:
        - link: study
        - column: code
          type: text
        - identity: [study, code]

       A branch table has a *many-to-one* relationship with its parent table.
       Its identity consists of the link to the parent table and an independent
       column.

    #. Creating a *cross* table::

        table: individual_appointment
        with:
        - link: individual
        - link: appointment
        - identity: [individual, appointment]

       A cross table establishes a *many-to-many* relationship between its
       parent tables.  Its identity consists of the links to the parent tables.


Data fact
=========

Data fact describes the content of a table.

`data`: ``<data_path>`` or ``<data>``
    Path to a CSV file with table data *or* table data in CSV format.

`of`: ``<table_label>``
    The name of the table.

    If not set, the table name is assumed to coincide with the file name in the
    ``data`` clause.  You don't need to specify the table name if the data is
    defined within a ``with`` clause of a table fact.

`present`: ``true`` (default) or ``false``
    Indicates whether the table contains the given data.

Table data must be provided in CSV format.  The first line in the CSV input
should contain the names of columns and links.  Subsequent lines should contain
values for the respective columns and links.  Each line represents a table row.

CSV input must include values for identity columns and links.

A column value must be a valid HTSQL literal value of the column type (e.g.
``true`` and ``false`` for a *boolean* column, date in ``YYYY-MM-DD`` format
for a *date* column, and so on).

A link value must be specified using HTSQL identity format: a dot-separated
combination of column and link values that form the identity of the target row.

An empty value indicates that the respective column or link is to be ignored.
It is impossible to represent a ``NULL`` value or an empty string using CSV
format.

*(TODO)* JSON and YAML formats are also supported.

Deploying a row of input when ``present`` is ``true``:

    Ensures that the table contains a row with the given values.

    If the table does not contain a row with the given values, but there is a
    row with the same identity value, the row is updated to match the given
    values.

    If the table does not contain a row with the same identity value, a new row
    is added.

    It is an error if the input contains a link to a row which does not exist.

    It is an error if table ``<table_label>`` or any of the input columns and
    links do not exist.

Deploying a row of input when ``present`` is ``false``:

    Not supported at the moment.

Examples:

    #. Adding table content::

        data: |
          code,title
          fos,Family Obesity Study
          adsl,Autism Spectrum Disorder Lab
        of: study

       Input data could also be stored in a file::

        data: ./deploy/study.csv
        of: study

       The file ``./deploy/study.csv`` should contain CSV input::

        code,title
        fos,Family Obesity Study
        adsl,Autism Spectrum Disorder Lab

       Since the name of the file (without extension) is the same as the table
       name, the ``of`` clause could be omitted::

        data: ./deploy/study.csv

       Similarly, ``of`` is omitted if the table content is specified in a
       ``with`` clause::

        table: study
        with:
        - data: |
            code,title
            fos,Family Obesity Study
            adsl,Autism Spectrum Disorder Lab

    #. Adding table data with empty values::

        data: |
          code,sex,mother,father
          1000,female,,
          1001,male,,
          1002,female,1000,1001
          1003,male,1000,1001
          1004,,1000,1001
        of: individual

    #. Setting link values::

        data: |
          case,individual
          family.10000,1000
          family.10000,1001
          family.10000,1002
          family.10000,1003
          family.10000,1004
        of: participation


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


