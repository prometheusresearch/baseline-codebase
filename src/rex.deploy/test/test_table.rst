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

    >>> fact = driver.parse("""{ table: individual }""")

    >>> fact
    TableFact('individual')
    >>> print(fact)
    table: individual

You could indicate possible old names of the table using ``was`` field::

    >>> fact = driver.parse("""{ table: individual, was: subject }""")
    >>> fact
    TableFact('individual', former_labels=['subject'])
    >>> print(fact)
    table: individual
    was: [subject]

    >>> fact = driver.parse("""{ table: measure, was: [assessment, test] }""")
    >>> fact
    TableFact('measure', former_labels=['assessment', 'test'])
    >>> print(fact)
    table: measure
    was: [assessment, test]

Use field ``table`` to specify the table title::

    >>> fact = driver.parse("""{ table: individual, title: Test Subjects }""")
    >>> fact
    TableFact('individual', title='Test Subjects')
    >>> print(fact)
    table: individual
    title: Test Subjects

Turn off field ``reliable`` to create a fast, but not crash-safe table::

    >>> fact = driver.parse("""{ table: history, reliable: false }""")
    >>> fact
    TableFact('history', is_reliable=False)
    >>> print(fact)
    table: history
    reliable: false

Use field ``with`` to list facts to deployed together with the table fact::

    >>> fact = driver.parse("""{ table: individual,
    ...                          with: [{ column: code, type: text}] }""")
    >>> fact
    TableFact('individual', related=[ColumnFact('individual', 'code', 'text')])
    >>> print(fact)
    table: individual
    with:
    - column: code
      type: text

Nested facts must deploy columns, links or data of the table being deployed::

    >>> driver.parse("""{ table: individual,
    ...                   with: [{ table: sample }] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unrelated fact:
        "<unicode string>", line 2
    While parsing table fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ table: individual,
    ...                   with: [{ column: code, of: sample }] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unrelated fact:
        "<unicode string>", line 2
    While parsing table fact:
        "<unicode string>", line 1

Turn off flag ``present`` to indicate that the table is to be deleted::

    >>> fact = driver.parse("""{ table: individual, present: false }""")
    >>> fact
    TableFact('individual', is_present=False)
    >>> print(fact)
    table: individual
    present: false

You cannot combine ``present: false`` with the ``was``, ``reliable``, ``title``
or ``with`` fields::

    >>> driver.parse("""{ table: individual, present: false,
    ...                   title: Test Subjects }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unexpected clause:
        title
    While parsing table fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ table: individual, present: false,
    ...                   with: [{ column: code, type: text }] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unexpected clause:
        with
    While parsing table fact:
        "<unicode string>", line 1


Creating the table
==================

Deploying a table fact creates the table::

    >>> driver("""{ table: individual }""")
    CREATE TABLE "individual" (
        "id" "int4" NOT NULL
    );
    CREATE SEQUENCE "individual_seq" OWNED BY "individual"."id";
    ALTER TABLE "individual" ALTER COLUMN "id" SET DEFAULT nextval('"individual_seq"'::regclass);
    ALTER TABLE "individual" ADD CONSTRAINT "individual_uk" UNIQUE ("id");

    >>> schema = driver.get_schema()
    >>> 'individual' in schema
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
    rex.core.Error: Discovered table with mismatched reliability mode:
        history
    While deploying table fact:
        "<unicode string>", line 1

When the driver is locked and the table does not exist, an error is raised::

    >>> driver("""{ table: sample }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    rex.core.Error: Detected inconsistent data model:
        CREATE TABLE "sample" (
            "id" "int4" NOT NULL
        );
    While validating table fact:
        "<unicode string>", line 1

If the table already exists, the driver will verify that it has the ``id``
column with ``UNIQUE`` constraint::

    >>> driver.submit("""CREATE TABLE sample (sampleid int4 NOT NULL);""")
    CREATE TABLE sample (sampleid int4 NOT NULL);
    >>> driver.reset()
    >>> driver("""{ table: sample }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered table without surrogate key:
        sample
    While deploying table fact:
        "<unicode string>", line 1

    >>> driver.submit("""ALTER TABLE sample ADD COLUMN id int4 NOT NULL;""")
    ALTER TABLE sample ADD COLUMN id int4 NOT NULL;
    >>> driver.reset()
    >>> driver("""{ table: sample }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered table without surrogate key:
        sample
    While deploying table fact:
        "<unicode string>", line 1


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
    ALTER TABLE "visit" RENAME COLUMN "measure_id" TO "assessment_id";
    ALTER TABLE "visit" RENAME CONSTRAINT "visit_measure_fk" TO "visit_assessment_fk";
    ALTER INDEX "visit_measure_fk" RENAME TO "visit_assessment_fk";
    ALTER TABLE "assessment" RENAME CONSTRAINT "measure_individual_fk" TO "assessment_individual_fk";
    ALTER INDEX "measure_individual_fk" RENAME TO "assessment_individual_fk";
    ALTER TYPE "measure_status_enum" RENAME TO "assessment_status_enum";
    ALTER TABLE "assessment" RENAME CONSTRAINT "measure_pk" TO "assessment_pk";
    ALTER FUNCTION "measure_pk"() RENAME TO "assessment_pk";
    ALTER TRIGGER "measure_pk" ON "assessment" RENAME TO "assessment_pk";
    CREATE OR REPLACE FUNCTION "assessment_pk"() RETURNS "trigger" LANGUAGE plpgsql AS '
    BEGIN
        ...
    END;
    ';

Link ``visit.measure`` got renamed as well::

    >>> schema = driver.get_schema()
    >>> 'measure_id' in schema['visit']
    False
    >>> 'assessment_id' in schema['visit']
    True

Note that applying the same fact second time has no effect::

    >>> driver("""{ table: assessment, was: measure }""")


Reordering columns and links
============================

When table columns and links are specified within ``with`` clause, the relative
order is enforced.  If necessary, the respective table columns are reordered::

    >>> driver("""
    ... table: assessment
    ... with:
    ... - { column: code, type: text }
    ... - { link: individual }
    ... - { column: status, type: [in-process, processed, completed], default: in-process }
    ... """)
    ALTER TABLE "assessment" ADD COLUMN "?" "int4";
    UPDATE "assessment" SET "?" = "individual_id";
    ALTER TABLE "assessment" DROP COLUMN "individual_id";
    ALTER TABLE "assessment" RENAME COLUMN "?" TO "individual_id";
    ALTER TABLE "assessment" ALTER COLUMN "individual_id" SET NOT NULL;
    ALTER TABLE "assessment" ADD CONSTRAINT "assessment_pk" PRIMARY KEY ("individual_id", "code"), CLUSTER ON "assessment_pk";
    COMMENT ON CONSTRAINT "assessment_pk" ON "assessment" IS '---
    generators:
    - null
    - offset
    ';
    ALTER TABLE "assessment" ADD CONSTRAINT "assessment_individual_fk" FOREIGN KEY ("individual_id") REFERENCES "individual" ("id") ON DELETE CASCADE;
    CREATE INDEX "assessment_individual_fk" ON "assessment" ("individual_id");
    ALTER TABLE "assessment" ADD COLUMN "?" "assessment_status_enum";
    UPDATE "assessment" SET "?" = "status";
    ALTER TABLE "assessment" DROP COLUMN "status";
    ALTER TABLE "assessment" RENAME COLUMN "?" TO "status";
    ALTER TABLE "assessment" ALTER COLUMN "status" SET NOT NULL;
    ALTER TABLE "assessment" ALTER COLUMN "status" SET DEFAULT 'in-process';
    COMMENT ON COLUMN "assessment"."status" IS '---
    default: in-process
    ';


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

    >>> 'assessment_status_enum' in schema.types
    False

If a table has links into it, the links are dropped first::

    >>> driver("""
    ... - { table: identity }
    ... - { link: identity.individual }
    ... - { link: individual.mother, to: individual, required: false }
    ... - { link: individual.father, to: individual, required: false }
    ... """)            # doctest: +ELLIPSIS
    CREATE TABLE "identity" ...
    >>> driver("""{ table: individual, present: false }""")
    ALTER TABLE "identity" DROP COLUMN "individual_id";
    DROP TABLE "individual";

Let's destroy the test database::

    >>> driver.close()
    >>> cluster.drop()



