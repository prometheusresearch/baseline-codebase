********************
  Deploying tables
********************

.. contents:: Table of Contents


Parsing table record
====================

We start with creating a test database and a ``Driver`` instance::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_table')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

Field ``table`` denotes a table fact::

    >>> driver.parse("""{ table: individual }""")
    TableFact(u'individual')

Use field ``table`` to specify the table title::

    >>> driver.parse("""{ table: individual, title: Test Subjects }""")
    TableFact(u'individual', title=u'Test Subjects')

Turn off field ``reliable`` to create a fast, but not crash-safe table::

    >>> driver.parse("""{ table: history, reliable: false }""")
    TableFact(u'history', is_reliable=False)

Use field ``with`` to list facts to deployed together with the table fact::

    >>> driver.parse("""{ table: individual,
    ...                   with: [{ column: code, type: text}] }""")
    TableFact(u'individual', related=[ColumnFact(u'individual', u'code', u'text', is_required=True)])

Nested facts must deploy columns, links or data of the table being deployed::

    >>> driver.parse("""{ table: individual,
    ...                   with: [{ table: sample }] }""")
    Traceback (most recent call last):
      ...
    Error: Got unrelated fact:
        "<byte string>", line 2
    While parsing table fact:
        "<byte string>", line 1

    >>> driver.parse("""{ table: individual,
    ...                   with: [{ column: code, of: sample }] }""")
    Traceback (most recent call last):
      ...
    Error: Got unrelated fact:
        "<byte string>", line 2
    While parsing table fact:
        "<byte string>", line 1

Turn off flag ``present`` to indicate that the table is to be deleted::

    >>> driver.parse("""{ table: individual, present: false }""")
    TableFact(u'individual', is_present=False)

You cannot combine ``present: false`` with the ``reliable``, ``title`` or
``with`` fields::

    >>> driver.parse("""{ table: individual, present: false,
    ...                   reliable: false }""")
    Traceback (most recent call last):
      ...
    Error: Got unexpected clause:
        reliable
    While parsing table fact:
        "<byte string>", line 1

    >>> driver.parse("""{ table: individual, present: false,
    ...                   title: Test Subjects }""")
    Traceback (most recent call last):
      ...
    Error: Got unexpected clause:
        title
    While parsing table fact:
        "<byte string>", line 1

    >>> driver.parse("""{ table: individual, present: false,
    ...                   with: [{ column: code, type: text }] }""")
    Traceback (most recent call last):
      ...
    Error: Got unexpected clause:
        with
    While parsing table fact:
        "<byte string>", line 1


Creating the table
==================

Deploying a table fact creates the table::

    >>> driver("""{ table: individual }""")
    CREATE TABLE "individual" (
        "id" "serial4" NOT NULL
    );
    ALTER TABLE "individual" ADD CONSTRAINT "individual_id_uk" UNIQUE ("id");

    >>> schema = driver.get_schema()
    >>> u'individual' in schema
    True

Deploying the same fact second time has no effect::

    >>> driver("""{ table: individual }""")

If the table name is mangled, the original table label is stored in the table
comment.  Similarly, the table title is stored in the comment::

    >>> driver("""{ table: individual_id, title: Identity }""")     # doctest: +ELLIPSIS
    CREATE TABLE "individual_id__3dcb2f" ...
    COMMENT ON TABLE "individual_id__3dcb2f" IS '---
    label: individual_id
    title: Identity
    ';

To create a fast, but not crash-safe table, unset option ``present``::

    >>> driver("""{ table: history, reliable: false }""")
    CREATE UNLOGGED TABLE "history" (
        "id" "serial4" NOT NULL
    );
    ALTER TABLE "history" ADD CONSTRAINT "history_id_uk" UNIQUE ("id");

It is impossible to change this characteristic after the table is created::

    >>> driver("""{ table: history, reliable: true }""")
    Traceback (most recent call last):
      ...
    Error: Detected table with mismatched reliability characteristic:
        history
    While deploying table fact:
        "<byte string>", line 1

When the driver is locked and the table does not exist, an error is raised::

    >>> driver("""{ table: sample }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected missing table:
        sample
    While validating table fact:
        "<byte string>", line 1

If the table already exists, the driver will verify that it has the ``id``
column with ``UNIQUE`` constraint::

    >>> driver.submit("""CREATE TABLE sample (sampleid int4 NOT NULL);""")
    CREATE TABLE sample (sampleid int4 NOT NULL);
    >>> driver.reset()
    >>> driver("""{ table: sample }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing column:
        id
    While deploying table fact:
        "<byte string>", line 1

    >>> driver.submit("""ALTER TABLE sample ADD COLUMN id int4 NOT NULL;""")
    ALTER TABLE sample ADD COLUMN id int4 NOT NULL;
    >>> driver.reset()
    >>> driver("""{ table: sample }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing column UNIQUE constraint:
        id
    While deploying table fact:
        "<byte string>", line 1

When the driver is locked, the driver verifies that the metadata is
up-to-date::

    >>> driver("""{ table: individual, title: Test Subjects }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected missing metadata:
        ---
        title: Test Subjects
    While validating table fact:
        "<byte string>", line 1


Dropping the table
==================

You can use ``TableFact`` to remove a table::

    >>> driver("""{ table: individual, present: false }""")
    DROP TABLE "individual";

    >>> schema = driver.get_schema()
    >>> u'individual' in schema
    False

Deploying the same fact second time has no effect::

    >>> driver("""{ table: individual, present: false }""")

``Driver`` will refuse to drop a table when in locked mode::

    >>> driver("""{ table: individual }""")     # doctest: +ELLIPSIS
    CREATE TABLE "individual" ...
    >>> driver("""{ table: individual, present: false }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected unexpected table:
        individual
    While validating table fact:
        "<byte string>", line 1

It will also refuse to drop the table that has any links onto it::

    >>> driver("""
    ... - { table: identity }
    ... - { link: identity.individual }
    ... - { table: individual, present: false }
    ... """)
    Traceback (most recent call last):
      ...
    Error: Cannot delete a table with links into it:
        individual
    While deploying table fact:
        "<byte string>", line 4

If a table has any columns of ``ENUM`` type, the type is
deleted when the table is dropped::

    >>> driver("""{ column: identity.sex, type: [male, female] }""")
    CREATE TYPE "identity_sex_enum" AS ENUM ('male', 'female');
    ALTER TABLE "identity" ADD COLUMN "sex" "identity_sex_enum" NOT NULL;
    >>> u'identity_sex_enum' in schema.types
    True

    >>> driver("""{ table: identity, present: false }""")
    DROP TABLE "identity";
    DROP TYPE "identity_sex_enum";
    >>> u'identity_sex_enum' in schema.types
    False

Let's destroy the test database::

    >>> driver.close()
    >>> cluster.drop()


