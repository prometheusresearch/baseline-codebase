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

You could indicate possible old names of the table using ``was`` field::

    >>> driver.parse("""{ table: individual, was: subject }""")
    TableFact(u'individual', former_labels=[u'subject'])

    >>> driver.parse("""{ table: measure, was: [assessment, test] }""")
    TableFact(u'measure', former_labels=[u'assessment', u'test'])

Use field ``table`` to specify the table title::

    >>> driver.parse("""{ table: individual, title: Test Subjects }""")
    TableFact(u'individual', title=u'Test Subjects')

Turn off field ``reliable`` to create a fast, but not crash-safe table::

    >>> driver.parse("""{ table: history, reliable: false }""")
    TableFact(u'history', is_reliable=False)

Use field ``with`` to list facts to deployed together with the table fact::

    >>> driver.parse("""{ table: individual,
    ...                   with: [{ column: code, type: text}] }""")
    TableFact(u'individual', related=[ColumnFact(u'individual', u'code', u'text')])

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

You cannot combine ``present: false`` with the ``was``, ``reliable``, ``title``
or ``with`` fields::

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
        "id" "int4" NOT NULL
    );
    ALTER TABLE "individual" ADD CONSTRAINT "individual_uk" UNIQUE ("id");
    CREATE SEQUENCE "individual_seq" OWNED BY "individual"."id";
    ALTER TABLE "individual" ALTER COLUMN "id" SET DEFAULT nextval('individual_seq'::regclass);

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

    >>> driver("""{ table: history, reliable: false }""")           # doctest: +ELLIPSIS
    CREATE UNLOGGED TABLE "history" (
        "id" "int4" NOT NULL
    );
    ...

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
    Error: Refused to execute SQL in read-only mode:
        CREATE TABLE "sample" (
            "id" "int4" NOT NULL
        );
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


Renaming the table
==================

If you want to rename an existing table, specify the current name as ``was``
field.  We start with creating a new table ``measure``::

    >>> driver("""
    ... - { table: measure }
    ... - { link: measure.individual }
    ... - { column: measure.code, type: text }
    ... - { identity: [measure.individual, measure.code: offset] }
    ... - { column: measure.status, type: [in-process, processed, completed], default: in-process }
    ... - { table: visit }
    ... - { link: visit.measure }
    ... """)                # doctest: +ELLIPSIS
    CREATE TABLE "measure" ...

Now let us rename ``measure`` to ``assessment``::

    >>> driver("""{ table: assessment, was: measure }""")       # doctest: +ELLIPSIS
    ALTER TABLE "measure" RENAME TO "assessment";
    ALTER SEQUENCE "measure_seq" RENAME TO "assessment_seq";
    ALTER TABLE "assessment" RENAME CONSTRAINT "measure_uk" TO "assessment_uk";
    ALTER TABLE "assessment" RENAME CONSTRAINT "measure_individual_fk" TO "assessment_individual_fk";
    ALTER INDEX "measure_individual_fk" RENAME TO "assessment_individual_fk";
    ALTER TYPE "measure_status_enum" RENAME TO "assessment_status_enum";
    ALTER TABLE "assessment" RENAME CONSTRAINT "measure_pk" TO "assessment_pk";
    DROP TRIGGER "measure_pk" ON "assessment";
    DROP FUNCTION "measure_pk"();
    CREATE FUNCTION "assessment_pk"() RETURNS "trigger" LANGUAGE plpgsql AS '
    BEGIN
        ...
    END;
    ';
    CREATE TRIGGER "assessment_pk" BEFORE INSERT ON "assessment" FOR EACH ROW EXECUTE PROCEDURE "assessment_pk"();
    ALTER TABLE "visit" RENAME COLUMN "measure_id" TO "assessment_id";
    ALTER TABLE "visit" RENAME CONSTRAINT "visit_measure_fk" TO "visit_assessment_fk";
    ALTER INDEX "visit_measure_fk" RENAME TO "visit_assessment_fk";

Link ``visit.measure`` got renamed as well::

    >>> schema = driver.get_schema()
    >>> u'measure_id' in schema[u'visit']
    False
    >>> u'assessment_id' in schema[u'visit']
    True

Note that applying the same fact second time has no effect::

    >>> driver("""{ table: assessment, was: measure }""")


Dropping the table
==================

You can use ``TableFact`` to remove a table::

    >>> driver("""{ table: visit, present: false }""")
    DROP TABLE "visit";

Deploying the same fact second time has no effect::

    >>> driver("""{ table: visit, present: false }""")

If a table has any columns of ``ENUM`` type, the type is
deleted when the table is dropped.  Any generated procedure
is deleted as well::

    >>> driver("""{ table: assessment, present: false }""")
    DROP TABLE "assessment";
    DROP TYPE "assessment_status_enum";
    DROP FUNCTION "assessment_pk"();

    >>> u'assessment_status_enum' in schema.types
    False

If a table has links into it, the links are dropped first::

    >>> driver("""
    ... - { table: identity }
    ... - { link: identity.individual }
    ... - { link: individual.mother, to: individual }
    ... - { link: individual.father, to: individual }
    ... """)            # doctest: +ELLIPSIS
    CREATE TABLE "identity" ...
    >>> driver("""{ table: individual, present: false }""")
    ALTER TABLE "identity" DROP COLUMN "individual_id";
    DROP TABLE "individual";

Let's destroy the test database::

    >>> driver.close()
    >>> cluster.drop()


