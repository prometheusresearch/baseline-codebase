**************************
  REX.DEPLOY Usage Guide
**************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: func(literal)


Overview
========

This package provides database schema management for the Rex platform.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Getting started
===============

:mod:`rex.deploy` is a database schema management system.  It allows you to
describe and deploy the application database.

In this section, let's assume that you are developing a Rex application
:mod:`rex.deploy_demo` for managing medical research data.  This application
stores information about studies, research subjects and assessments in a
PostgreSQL database.  The application uses :mod:`rex.deploy` to describe the
structure of the database.

The database schema of the application is defined in a static resource
``deploy.yaml``.  For :mod:`rex.deploy_demo`, that's going to be the file
``rex.deploy_demo/static/deploy.yaml``::

    - table: study

    - column: code
      of: study
      type: text

    - identity: [code]
      of: study

    ...

This file is in YAML format.  It contains a sequence of statements, or *facts*,
describing the structure of the database.  The first fact is::

    table: study

It is translated to English as:

    The database has a table called ``study``.

The next fact::

    column: code
    of: study
    type: text

can be interpreted as follows:

    Table ``study`` has a column called ``code`` of type ``text``.

The third fact::

    identity: [code]
    of: study

means:

    Rows of table ``study`` are uniquely identified by column ``code``.

When you deploy the application schema, :mod:`rex.deploy` reads each fact and
makes sure that it holds true.  To do so, :mod:`rex.deploy` may alter the
current structure of the database.  For example, if you deploy
:mod:`rex.deploy_demo` schema on an empty database, :mod:`rex.deploy` will:

1. Create table ``study``.
2. Add column ``code`` to table ``study``.
3. Make ``code`` the primary key of table ``study``.

On the other hand, if you deploy the same schema over the same database
instance again, :mod:`rex.deploy` will realize that all the facts are already
satisfied and will leave the database intact.

A collection of facts related to the same table could be grouped together using
``with`` clause on the table fact.  For example, we could rewrite the
definition of the table ``study`` as follows::

    - table: study
      with:
      - column: code
        type: text
      - identity: [code]

This way we don't need to repeat the ``of`` clauses.  Other than that, this
form is functionally equivalent to the original schema definition.  In the
examples below, we will often write individual facts in the full form, but in
practice, a ``with`` clause is often used.


Deploying the schema
====================

In order to use :mod:`rex.deploy`, we need to add :mod:`rex.deploy` to the list
of dependencies of the application.

Then we use the ``rex`` command-line tool from package :mod:`rex.ctl`.  To
deploy the schema for :mod:`rex.deploy_demo` application, run::

    $ rex deploy rex.deploy_demo --set db=pgsql:deploy_demo

You can also store the application name and parameters in a configuration file
``rex.yaml``::

    project: rex.deploy_demo
    parameters:
      db: pgsql:deploy_demo

The ``rex`` utility will pick up the application configuration from a
``rex.yaml`` file in the current directory, so you can run::

    $ rex deploy

to deploy the application database.

For more information on the ``rex`` utility and ``rex.yaml`` configuration
file, see documentation of :mod:`rex.ctl`.


Describing the database
=======================

:mod:`rex.deploy` lets you describe database *tables*, table *columns* and
*links*, the *identity* of the table and the *data* stored in the table.

The simplest is a table fact.  For example::

    table: individual

It expresses a claim: There is a table called ``individual``.

You could also describe a negative assertion: There is *no* table called
``family``::

    table: family
    present: false

When these facts are deployed, :mod:`rex.deploy` verifies that these assertions
hold true.  If not, it will try to alter the database to make them true.  If
the database has no table ``individual``, it will be created.  If the database
has a table called ``family``, it will be deleted.

Another variant of a table fact allows you to get the table renamed::

    table: instrument
    was: measure_type

It reads as: The database has a table called ``instrument``, which was
previously called ``measure_type``.

When ``was`` clause is present, the behavior of :mod:`rex.deploy` is slightly
more complicated than usual.  In case when the database has no table called
``instrument``, :mod:`rex.deploy` checks if there is a table called
``measure_type.``.  If there is, it is renamed to ``instrument``.  Otherwise, a
new table ``instrument`` is created.

When HTSQL displays the content of the table in tabular form (e.g. HTML, CSV or
plain text), the capitalized table name is used as the header of the tabular
output.  You can use the ``title`` clause to provide a custom header::

    table: instrument
    title: Instrument or Measure

A table with no fields is not very useful.  To describe the structure of a
table, we use *column* and *link* facts.

A column fact describes a column of a table.  For example::

    - column: first_name
      of: identity
      type: text

    - column: last_name
      of: identity
      type: text

    - column: birthday
      of: identity
      type: date
      required: false

These definitions express the claim that table ``identity`` has columns
``first_name`` and ``last_name`` of text type and a column ``birthday`` of date
type.  Column ``birthday`` is not required, which means that the table will
accept ``NULL`` as the column value.  Columns ``first_name`` and ``last_name``
are required.

:mod:`rex.deploy` supports a number of column types, in particular, boolean (a
type with two values ``false`` and ``true``), integer, text and date.  It also
allows you to declare that a column has an *enumerated* type, a data type that
consists of a set of distinct named values.  For example, let's define a column
``sex`` with three values: ``male``, ``female``, and ``intersex``::

    column: sex
    of: individual
    type: [male, female, intersex]

Besides the column type, you can also specify the default value of the column.
When you add a new row to the table, the default value is used when the row
does not contain an explicit column value.  For example, we can make new study
records marked as not closed::

    column: closed
    of: individual
    type: boolean
    default: false

You can also express the fact that a column does not exist.  For example::

    column: middle
    of: identity
    present: false

A *link* is a connection between two tables.  For example, to express the fact
that each study protocol is associated with some study, we write::

    link: study
    of: protocol
    to: study

This defines a link called ``study`` from table ``protocol`` to table
``study``.  Since the name of the link coincides with the name of the target
table, we can omit the ``to`` clause::

    link: study
    of: protocol

A link may connect a table to itself.  For example, this is how we can express
parental relationships::

    - link: mother
      of: individual
      to: individual
      required: false

    - link: father
      of: individual
      to: individual
      required: false

Note that we added a clause ``required: false`` to the link definition.  It
means that the table will allow ``NULL`` as the link value.  We must always set
``required: false`` for self-referential links, otherwise, we won't be able to
add any rows to the table.

Table identity is a set of columns and links which uniquely identify each row
of the table.  In the simplest case, it consists of a single column::

    - table: individual

    - column: code
      of: individual
      type: text

    - identity: [code: random]
      of: individual

In this case, the identity of the ``individual`` table is its ``code`` column.
The ``random`` clause indicates that the column value is to be randomly
generated when a record is inserted to the table.

In more complex cases, table identity may include links to other tables.  In
particular, a table which identity consists of two links establishes a
many-to-many relationship between the linked tables::

    - table: participation

    - link: case
      of: participation

    - link: individual
      of: participation

    - identity: [case, individual]
      of: participation

In HTSQL, you can get the identity value for a table row using the ``id()``
function.  For example, the ``id()`` of ``individual`` is the value of the
column ``individual.code``::

    deploy_demo$ /individual{id(), code}

     | individual  |
     +------+------+
     | id() | code |
    -+------+------+-
     | 1000 | 1000 |
     | 1001 | 1001 |
     | 1002 | 1002 |
     ...

For ``participation``, ``id()`` is a combination of ``case.id()`` and
``individual.id()``::

    deploy_demo$ /participation{id(), case{id()}, individual{id()}}

     | participation                                   |
     +---------------------+--------------+------------+
     |                     | case         | individual |
     |                     +--------------+------------+
     | id()                | id()         | id()       |
    -+---------------------+--------------+------------+-
     | (family.10000).1000 | family.10000 | 1000       |
     | (family.10000).1001 | family.10000 | 1001       |
     | (family.10000).1002 | family.10000 | 1002       |
    ...

:mod:`rex.deploy` allows you to define not only the structure of the database,
but also the content of the tables.  It is useful for populating fact tables
and sample data.  For example, we can add some rows to the ``individual``
table::

    data: |
      code,sex,mother,father
      1000,female,,
      1001,male,,
      1002,female,1000,1001
      1003,male,1000,1001
      1004,male,1000,1001
    of: individual

The ``data`` clause contains the content of the table in tabular (CSV) or
structured (YAML) format.

In the following sections we describe the format and behavior of different
types of facts.


Table fact
==========

A table fact describes a database table.

`table`: ``<label>``
    The name of the table.

`was`: ``<former_label>`` or [``<former_label>``]
    The previous name of the table.

`present`: ``true`` (default) or ``false``
    Indicates whether the table exists in the database.

`reliable`: ``true`` (default) or ``false``
    Indicates whether the table is crash-safe.

    Unset this flag to create a table that has fast update operations, but may
    lose committed data when the database server crashes.

`title`: ``<title>``
    Header used in tabular output.  If not provided, the header is generated
    from the table name.

    This clause cannot be set if ``present`` is ``false``.

`with`: [...]
    List of facts related to the table.  Facts listed here have their ``of``
    clauses automatically assigned to the name of the table.

    This clause cannot be set if ``present`` is ``false``.

Deploying when ``present`` is ``true``:

    Ensures that the database has a table called ``<label>``.  If the table
    does not exist, it is created.

    If table ``<label>`` does not exist, but there is a table called
    ``<former_label>``, the table is renamed to ``<label>``.

    The table must have a surrogate key column ``id``.  It is created
    automatically when the table is created.

    All related facts from the ``with`` clause are deployed as well.

Deploying when ``present`` is ``false``:

    Ensures that the database has no table ``<label>``.  If a table with this
    name exists, it is deleted.  All links to the table are deleted as well.

Examples:

    #. Adding a new table::

        table: individual

    #. Removing a table::

        table: family
        present: false

    #. Renaming or creating a table::

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
          after: [study]

        - identity: [study, code]
          of: protocol

        - column: title
          of: protocol
          type: text
          after: [study, code]

    #. Adding a table with fast updates (but not crash-safe)::

        table: history
        reliable: false


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
    *float*, *text*, *date*, *time*, *datetime*, *json*.

    If the column has an ``ENUM`` type, specify a list of ``ENUM`` labels.

    This clause cannot be used if ``present`` is ``false``.

`default`:
    The default value of the column.  The value must be compatible
    with the column type.

    For *date* and *datetime* columns, you can use special values ``today()``
    and ``now()``, which generate the current date and timestamp respectively.

`was`: ``<former_label>`` or [``<former_label>``]
    The previous name of the column.

`required`: ``true`` (default) or ``false``
    Indicates whether or not the column forbids ``NULL`` values.

    This clause cannot be used if ``present`` is ``false``.

`unique`: ``true`` or ``false`` (default)
    Indicates that each column value must be unique across all rows of the
    table.

    This clause cannot be used if ``present`` is ``false``.

`title`: ``<title>``
    Header used in tabular output.  If not provided, the header is generated
    from the column name.

    This clause cannot be set if ``present`` is ``false``.

`after`: ``<front_label>`` or [``<front_label>``]
    List of fields that should appear before the column.

    If the column fact is specified within a ``with`` clause, this field
    is populated automatically.

    This clause cannot be set if ``present`` is ``false``.

Deploying when ``present`` is ``true``:

    Ensures that table ``<table_label>`` has a column ``<label>`` of type
    ``<type_label>``.  If the column does not exist, it is created.

    If the table has no column ``<label>``, but contains a column called
    ``<former_label>``, the column is renamed to ``<label>``.

    If ``required`` is set to ``true``, which is the default, the column
    should have a ``NOT NULL`` constraint.

    If ``unique`` is set to ``true``, a ``UNIQUE`` constraint is added on the
    column.

    If the column exists, but does not match the description, it is converted
    to match the description when possible.

    If the column appears before any of the fields in the ``after`` list, the
    column is moved to the end of the table.

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

       When the column is defined in a ``with`` clause, ``of`` could be
       omitted::

        table: study
        with:
        - column: title
          type: text

    #. Creating or renaming a column::

        column: last_name
        of: identity
        was: surname
        type: text

    #. Setting the column title::

        column: middle
        of: identity
        type: text
        title: Middle Name

    #. Removing a column::

        column: title
        of: study
        present: false

    #. Adding an ``ENUM`` column::

        column: sex
        of: individual
        type: [male, female, intersex]

    #. Adding a column that permits ``NULL`` values::

        column: middle
        of: identity
        type: text
        required: false

    #. Adding a column with unique values::

        column: email
        of: user
        type: text
        unique: true

    #. Setting the column default value::

        column: closed
        of: study
        type: boolean
        default: false

       For ``ENUM`` columns, you can use one of the labels
       as the default value::

        column: sex
        of: individual
        type: [not-known, male, female, not-applicable]
        default: not-known

       To use the current timestamp as the default value, write::

        column: last_updated
        of: measure
        type: datetime
        default: now()


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

`was`: ``<former_label>`` or [``<former_label>``]
    The previous name of the link.

`default`: ``<default>``
    The default value of the link.  The value must be a well-formed identity
    value of the target table and the target row must exist in the database.

`required`: ``true`` (default) or ``false``
    Indicates whether or not the link forbids ``NULL`` values.

    This clause cannot be used if ``present`` is ``false``.

`unique`: ``true`` or ``false`` (default)
    Indicates that each link value must be unique across all rows of the table.

    This clause cannot be used if ``present`` is ``false``.

`title`: ``<title>``
    Header used in tabular output.  If not provided, the header is generated
    from the link name.

    This clause cannot be set if ``present`` is ``false``.

`after`: ``<front_label>`` or [``<front_label>``]
    List of fields that should appear before the link.

    If the fact is specified within a ``with`` clause, this field is populated
    automatically.

    This clause cannot be set if ``present`` is ``false``.

Deploying when ``present`` is ``true``:

    Ensures that table ``<table_label>`` has column ``<label>_id`` and a
    ``FOREIGN KEY`` constraint from ``<table_label>.<label>_id`` to
    ``<target_table_label>.id``.  If the column and the constraint do not
    exist, they are created.

    If ``<default>`` is set, find the corresponding row in the target table.
    Use the ``id`` of the row as the default value of the column.

    Column ``<former_label>_id`` is renamed to ``<label>_id`` if the former
    exists and the latter does not.

    The ``FOREIGN KEY`` constraint is created with ``ON DELETE SET DEFAULT`` if
    the link is not a part of the table identity, otherwise it is created with
    ``ON DELETE CASCADE``.

    Together with the ``FOREIGN KEY`` constraint, an index on ``<label>_id`` is
    created.

    If ``required`` is set to ``true`` (default), the column should have
    a ``NOT NULL`` constraint.

    If ``unique`` is set to ``true``, a ``UNIQUE`` constraint is added on the
    column.

    If the link appears before any of the fields in the ``after`` list, it is
    moved to the end of the table.

    It is an error if either ``<table_label>`` or ``<target_table_label>``
    tables do not exist.

Deploying when ``present`` is ``false``:

    Ensures that table ``<table_label>`` does not have column ``<label>_id``.
    If such column exists, it is deleted.

    It is *not* an error if table ``<table_label>`` does not exist.

Examples:

    #. Adding a link between two tables::

        link: individual
        of: sample
        to: individual

       Since the name of the link and the name of the target table are the
       same, we could omit the ``to`` clause::

        link: individual
        of: sample

       The name of the origin table could be specified in the ``link`` clause::

        link: sample.individual

       When the link is defined within a ``with`` clause, the table name could
       be omitted::

        table: sample
        with:
        - link: individual

    #. Creating or renaming a link::

        link: birth_mother
        of: individual
        to: individual
        was: mother

    #. Removing a link::

        link: individual
        of: sample
        present: false

    #. Adding a link with default value::

        link: site
        of: study
        default: main

       This sets the default value for ``study.site`` to ``site[main]``.

    #. Adding a link that permits ``NULL`` values::

        link: originating_study
        of: measure
        to: study
        required: false

    #. Adding a unique link::

        link: user
        of: staff
        unique: true

    #. Adding a self-referential link::

        link: mother
        of: individual
        to: individual
        required: false

       Note that a self-referential link must allow ``NULL`` values.


Alias fact
==========

An alias fact defines a calculated field.

`alias`:
    The name of the alias *or* the full alias definition.

    Can be specified in one of the following forms:

    * ``<label>``
    * ``<table_label>.<label>``
    * ``<label>($<parameter>, ...)``
    * ``<label> := <expression>``

`of`: ``<table_label>``
    The name of the table.

    You don't need to specify this clause if the table name is set in the
    ``alias`` clause or if the column is defined in a ``with`` clause of a
    table fact.

`parameters`: [``<label>``] *or* ``null`` (default)
    For parameterized calculations, a list of formal parameters.

`expression`: ``<expression>`` or ``null`` (default)
    The definition of the alias.

`present`: ``true`` (default) or ``false``
    Indicates whether the alias exists.

Deploying when ``present`` is ``true``:

    Ensures that table ``<table_label>`` contains an up-to-date
    definition of an alias ``<label>``.

    It is an error if table ``<table_label>`` does not exist.

Deploying when ``present`` is ``false``:

    Ensures that ``<table_label>`` does not have an alias called ``<label>``.
    If table metadata contains a definition of the alias, it is removed.

    It is *not* an error if table ``<table_label>`` does not exist.

Examples:

    #. Adding a calculated field to to a table::

        alias: size
        of: family
        expression: count(individual)

       This example can also be written as follows::

        alias: family.size := count(individual)

       When the column is defined in a ``with`` clause, ``of`` could be
       omitted::

        table: study
        with:
        - alias: size := count(individual)

    #. Adding a calculated field with parameters::

        alias: individual_by_sex
        of: family
        parameters: [sex]
        expression: individual?sex=$sex

       This example can also be written as follows::

        alias: family.individual_by_sex($sex) := individual?sex=$sex

    #. Removing a calculated field::

        alias: size
        of: study
        present: false


Identity fact
=============

Identity fact describes identity of a table.

Table identity is a set of table columns and links which could uniquely
identify every row in the table.

`identity`: [``<label>`` or ``<table_label>.<label>`` or ``<label>: <generator>``]
    Names of columns and links that form the table identity.

    Each name may include the table name separated by a period.

    Each column may have an associated generator, which populates an empty
    column value when a new record are inserted.  Currently two generators
    are supported: ``offset`` and ``random``.

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

    If there are any generators, a ``BEFORE INSERT`` trigger is created.  The
    trigger sets the generated column value for new records unless the value is
    provided explicitly.

    It is an error if table ``<table_label>`` or any of the columns do not
    exist.

The following generators are supported:

`offset` (for *integer* and *text* columns)
    Column values are populated from sequence ``1``, ``2``, ``3``, and so on
    (``'001'``, ``'002'``, ``'003'`` for text columns).

    Values are grouped by the prior identity columns and links.

`random` (for *integer* and *text* columns)
    For an integer column, the generated value is a random number in the
    range from 1 to 999999999.

    For a text column, the generated value is a sequence of random letters
    and numbers that follows pattern ``A00A0000``.

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

    #. Creating a generated identity::

        identity: [individual, sample_type, code: offset]
        of: sample

       When you insert a record to the ``sample`` table, the ``code`` column
       will be automatically populated by values ``001``, ``002``, and so on
       within each group of ``individual`` and ``sample_type``.

    #. Creating a *trunk* table::

        table: individual
        with:
        - column: code
          type: text
        - identity: [code]

       A trunk table is a table whose identity does not depend on other tables.
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
    Path to a file with table data *or* embedded table data.

`of`: ``<table_label>``
    The name of the table.

    If not set, the table name is assumed to coincide with the file name in the
    ``data`` clause.  You don't need to specify the table name if the data is
    defined within a ``with`` clause of a table fact.

`present`: ``true`` (default) or ``false``
    Indicates whether the table contains the given data.

Table data must be provided in tabular (CSV) or structured (JSON, YAML)
format.

When data is in CSV format, the first line in the CSV input should contain the
names of columns and links.  Subsequent lines should contain values for the
respective columns and links.  Each line represents a table row.

When data is in structured format, it must contain either a single record or a
list of records.  Record fields must coincide with the column and link names.

Input must include values for identity columns and links.

A column value must be a valid HTSQL literal value of the column type (e.g.
``true`` or ``false`` for a *boolean* column, date in ``YYYY-MM-DD`` format for
a *date* column, and so on).

A link value must be specified using HTSQL identity format: a dot-separated
combination of column and link values that form the identity of the target row.

An empty value in CSV input indicates that the respective column or link is to
be ignored.  It is impossible to represent a ``NULL`` value or an empty string
using CSV format.  In YAML, use ``null`` and ``''`` to represent a ``NULL``
value and an empty string respectively.

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

    #. Adding table data using YAML format::

        data:
          - code: fos
            title: Family Obesity Study
          - code: adsl
            title: Autism Spectrum Disorder Lab
        of: study

    #. Adding table data with empty values::

        data: |
          code,sex,mother,father
          1000,female,,
          1001,male,,
          1002,female,1000,1001
          1003,male,1000,1001
          1004,,1000,1001
        of: individual

    #. Setting links::

        data: |
          case,individual
          family.10000,1000
          family.10000,1001
          family.10000,1002
          family.10000,1003
          family.10000,1004
        of: participation


Raw fact
========

A raw fact allows you to execute raw SQL code.

`sql`: ``<sql_path>`` or ``<sql>``
    Path to a SQL file *or* a SQL command containing DDL statement.
`unless`: ``<check_sql_path>`` or ``<check_sql>``.
    Path to a SQL file *or* a SQL command that verifies the fact postcondition.

You can use raw facts if regular :mod:`rex.deploy` facts do not provide
necessary capabilities.  For example, you can use raw facts to install
indexes and triggers.

Both ``sql`` and ``unless`` fields permit both a SQL statement and a path to a
SQL file.

The ``sql`` statement is executed unless the ``unless`` statement produces
at least one ``TRUE`` value.

Deploying:

    Executes the ``unless`` statement and fetches the output.

    If ``unless`` produces no ``TRUE`` values or no values at all, the ``sql``
    statement is executed.

Examples:

    #. Creating a full-text search index::

        sql: |
          CREATE INDEX study_title_idx ON study
          USING gin(to_tsvector('english', title));
        unless: |
          SELECT TRUE FROM pg_catalog.pg_class
          WHERE relname = 'study_title_idx';

    #. Creating a trigger::

        sql: ./deploy/measure__last_modified__proc.sql
        unless: |
          SELECT obj_description(oid, 'pg_proc') ~ '^revision: 2014-10-14$'
          FROM pg_catalog.pg_proc
          WHERE proname = 'measure__last_modified__proc';

       File ``./deploy/measure__last_modified__proc.sql`` contains the trigger
       itself::

        CREATE OR REPLACE FUNCTION measure__last_modified__proc() RETURNS trigger
        LANGUAGE plpgsql
        AS $_$
            BEGIN
                IF NEW.last_modified IS NULL THEN
                    NEW.last_modified := 'now'::text::timestamp;
                END IF;
                RETURN NEW;
            END;
        $_$;

        COMMENT ON FUNCTION measure__last_modified__proc()
        IS 'revision: 2014-10-14';

        DROP TRIGGER IF EXISTS measure__last_modified__proc ON measure;

        CREATE TRIGGER measure__last_modified__proc BEFORE UPDATE ON measure
        FOR EACH ROW EXECUTE PROCEDURE measure__last_modified__proc();

       Note that we use a comment on the trigger procedure to verify if the
       latest version of the trigger has been already deployed.


Include fact
============

You can use ``include`` directive to load facts from a file.

`include`: ``<path>``
    Path to a YAML file containing a collection of facts.

Examples:

    #. Splitting ``deploy.yaml``::

        - include: ./deploy/study.yaml
        - include: ./deploy/individual.yaml
        - include: ./deploy/measure.yaml

    #. Deploying the audit trigger::

        - include: rex.deploy:/deploy/audit.yaml

       The audit trigger logs all ``INSERT``, ``UPDATE`` and ``DELETE`` actions
       into SQL table ``audit.audit``.


Auditing CRUD operations
========================

:mod:`rex.deploy` includes a mechanism for recording a log of ``INSERT``,
``UPDATE``, ``DELETE`` operations.  To enable it, add to ``deploy.yaml``::

    include: rex.deploy:/deploy/audit.yaml

This line:

1) Creates schema ``audit`` and table ``audit.audit``.

2) Creates trigger function ``audit`` and attaches it to all current
   and future tables in the ``public`` schema.

The trigger is invoked on every ``INSERT``, ``UPDATE`` and ``DELETE``
operations and records the following information into the ``audit`` table:

`timestamp`
    The time the current transaction started.
`session`
    The current Rex user from ``rex.session`` variable set by :mod:`rex.db`; if
    not set, the current database user.
`action`
    ``'insert'``, ``'update'``, ``'delete'``.
`name`
    The name of the table.
`old`
    The current record in JSON format; ``NULL`` for ``INSERT`` operations.
`new`
    The new or updated record in JSON format; ``NULL`` for ``DELETE``
    operations.

The table is not exposed via HTSQL.  Any application that wants to use the
audit mechanism should query the table directly using SQL.


Introduction to Python API
==========================

:mod:`rex.deploy` provides a rich API for manipulating PostgreSQL databases.
We start with describing how to use it to manage a cluster of PostgreSQL
databases.

Use function :func:`rex.deploy.get_cluster` to get a
:class:`rex.deploy.Cluster` instance associated with the application database::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.deploy_demo')

    >>> from rex.deploy import get_cluster
    >>> with demo:
    ...     cluster = get_cluster()

Using :class:`rex.deploy.Cluster`, you can create and destroy databases in the
cluster::

    >>> cluster.create('deploy_demo_readme')
    >>> cluster.exists('deploy_demo_readme')
    True

    >>> cluster.drop('deploy_demo_readme')
    >>> cluster.exists('deploy_demo_readme')
    False

You can also clone an existing database that resides on the same cluster::

    >>> cluster.clone('deploy_demo', 'deploy_demo_clone')
    >>> cluster.exists('deploy_demo_clone')
    True

    >>> cluster.drop('deploy_demo_clone')

Use function :func:`rex.deploy.introspect` to get a catalog image that reflects
the structure of the database::

    >>> from rex.deploy import introspect

    >>> connection = cluster.connect()
    >>> cursor = connection.cursor()
    >>> catalog = introspect(cursor)

The :class:`rex.deploy.CatalogImage` object contains database schemas, tables,
columns, types and constraints::

    >>> for schema in catalog:
    ...     print(schema)                        # doctest: +ELLIPSIS
    audit
    information_schema
    pg_catalog
    ...

    >>> public_schema = catalog['public']
    >>> for table in public_schema:
    ...     print(table)                         # doctest: +ELLIPSIS
    appointment
    appointment_type
    case
    ...

    >>> individual_table = public_schema['individual']
    >>> for column in individual_table:
    ...     print(column)                        # doctest: +ELLIPSIS
    id
    code
    sex
    ...

:mod:`rex.deploy` allows you to create and deploy database facts
programmatically.  To do that, you need to create a :class:`rex.deploy.Driver`
instance for the target database::

    >>> driver = cluster.drive()

Then you can use it to deploy database facts::

    >>> from rex.deploy import TableFact

    >>> driver(TableFact('individual'))

    >>> driver.commit()
    >>> driver.close()

:mod:`rex.deploy` also provides a :func:`rex.deploy.mangle` utility for
generating a valid SQL name from a list of fragments and an optional suffix::

    >>> from rex.deploy import mangle

    >>> mangle(['individual', 'mother'], 'fk')
    'individual_mother_fk'

:mod:`rex.deploy` also provides high-level API for introspecting and
manipulating database schemas.  To start using it, one needs to create
a schema object::

    >>> from rex.deploy import model

    >>> with demo:
    ...     schema = model()

    >>> print(schema)            # doctest: +ELLIPSIS
    - table: appointment
    - table: appointment_type
    ...
    - table: appointment
      with:
      - link: appointment_type
      - column: code
    ...

Using this schema object, we can find any table by name::

    >>> individual_table = schema.table('individual')
    >>> print(individual_table)
    table: individual

Similarly, a table object allows you to find any field by name::

    >>> print((individual_table.column('sex')))
    column: sex
    of: individual
    type: [not-known, male, female, not-applicable]
    default: not-known

    >>> print((individual_table.link('mother')))
    link: mother
    of: individual
    to: individual
    required: false


HTSQL functions
===============

In addition to database management, :mod:`rex.deploy` wraps a number of
PostgreSQL functions:

``json(text)``
    Converts a text value to JSON.
``json_get(obj, name)``
    Extracts field ``name`` from a JSON object as a text value.
``json_get_json(obj, name)``
    Extracts field ``name`` from a JSON object as a JSON object.
``re_matches(text, pat)``
    Checks if ``text`` matches the regular expression ``pat``.
``ft_matches(text, key)``
    Checks if ``text`` contains ``key`` by performing full-text search on
    ``text`` value.
``ft_headline(text, key)``
    Extracts a matching substring from ``text`` in HTML format.
``ft_rank(text, key)``
    Estimates the relevance of the match.
``ft_query_matches(text, q)``, ``ft_query_headline(text, q)``, ``ft_query_rank(text, q)``
    Performs full-text search on ``text`` using full-text search query ``q``.
``join(text, sep)``
    Concatenates a set of text values.
``abs(x)``
    The absolute value of ``x``.
``sign(x)``
    The sign of ``x``.
``ceil(x)``
    Smallest integer not less than ``x``.
``floor(x)``
    Largest integer not greater than ``x``.
``div(x,y)``
    Integer quotient of ``x/y``.
``mod(x,y)``
    Remainder of ``x/y``.
``exp(x)``
    Exponential.
``pow(x,y)``
    ``x`` raised to the power of ``y``.
``ln(x)``
    Natural logarithm.
``log10(x)``
    Base 10 logarithm.
``log(x,y)``
    Logarithm to base ``y``.
``pi()``, ``acos(x)``, ``asin(x)``, ``atan(x)``, ``atan2(y,x)``, ``cos(x)``, ``cot(x)``, ``sin(x)``, ``tan(x)``
    Trigonometric functions.
``random()``
    Random value in the range from 0 to 1.

:mod:`rex.deploy` also provides an identity-to-text conversion operation.



