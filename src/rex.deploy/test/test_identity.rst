**********************
  Deploying identity
**********************

.. contents:: Table of Contents


Parsing identity record
=======================

Start with creating a test database and a driver::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_identity')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

Identity fact is denoted by field ``identity``::

    >>> fact = driver.parse("""{ identity: [individual.code] }""")
    >>> fact
    IdentityFact('individual', ['code'])
    >>> print(fact)
    identity: [code]
    of: individual

The identity should have at least one label::

    >>> driver.parse("""{ identity: [] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got missing identity fields
    While parsing identity fact:
        "<unicode string>", line 1

The table of the identity constraint could be set either as a prefix
of identity label or as a separate ``of`` field::

    >>> fact = driver.parse("""{ identity: [code], of: individual }""")
    >>> fact
    IdentityFact('individual', ['code'])
    >>> print(fact)
    identity: [code]
    of: individual

It is an error of the table of the identity is not set or set
multiple times::

    >>> driver.parse("""{ identity: [code] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got missing table name
    While parsing identity fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ identity: [individual.code], of: study }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got mismatched table names:
        individual, study
    While parsing identity fact:
        "<unicode string>", line 1

Identity label could be supplied with an associated generator::

    >>> fact = driver.parse("""{ identity: [code: random], of: individual }""")
    >>> fact
    IdentityFact('individual', ['code'], ['random'])
    >>> print(fact)
    identity:
    - {code: random}
    of: individual

When you provide an identity specification as a YAML structure, specify the
column and the generator as a pair::

    >>> fact = driver.parse({ 'identity': ['individual', {'measure_type': None}, ('code', 'offset')],
    ...                       'of': 'measure' })
    >>> fact
    IdentityFact('measure', ['individual', 'measure_type', 'code'], [None, None, 'offset'])
    >>> print(fact)
    identity:
    - individual
    - measure_type
    - {code: offset}
    of: measure

Ill-formed generators are rejected::

    >>> driver.parse("""{ identity: [[code, random]], of: individual }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a pair
    Got:
        a sequence
    While parsing:
        "<unicode string>", line 1
    While validating field:
        identity


Creating the identity
=====================

Deploying an identity fact creates a ``PRIMARY KEY`` constraint
on a table::

    >>> driver("""
    ... - { table: individual }
    ... - { column: individual.code, type: text }
    ... - { identity: [individual.code] }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "individual" ...
    ALTER TABLE "individual" ADD CONSTRAINT "individual_pk" PRIMARY KEY ("code"), CLUSTER ON "individual_pk";

    >>> schema = driver.get_schema()
    >>> individual_table = schema['individual']
    >>> individual_table.primary_key is not None
    True

Deploying the same fact again has no effect::

    >>> driver("""{ identity: [individual.code] }""")

Notably, the identity columns must have ``NOT NULL`` constraint::

    >>> driver("""{ column: individual.code, type: text, required: false }""")
    ALTER TABLE "individual" DROP CONSTRAINT "individual_pk";
    ALTER TABLE "individual" ALTER COLUMN "code" DROP NOT NULL;

    >>> driver("""{ identity: [individual.code] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered nullable field:
        code
    While deploying identity fact:
        "<unicode string>", line 1

    >>> driver("""{ column: individual.code, type: text, required: true }""")
    ALTER TABLE "individual" ALTER COLUMN "code" SET NOT NULL;

    >>> driver("""{ identity: [individual.code] }""")
    ALTER TABLE "individual" ADD CONSTRAINT "individual_pk" PRIMARY KEY ("code"), CLUSTER ON "individual_pk";

The driver also prohibits identities with cycles::

    >>> driver("""
    ... - { table: left }
    ... - { table: right }
    ... - { column: left.code, type: text }
    ... - { column: right.code, type: text }
    ... - { link: left.right }
    ... - { link: right.left }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "left" ...

    >>> driver("""
    ... - { identity: [left.right] }
    ... - { identity: [right.left] }
    ... """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered identity loop:
        left.right
    While deploying identity fact:
        "<unicode string>", line 3

    >>> driver("""
    ... - { identity: [right.code] }
    ... - { identity: [right.left] }
    ... """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered identity loop:
        left.right
    While deploying identity fact:
        "<unicode string>", line 3

Table identity may include both columns and links.  Respective ``FOREIGN KEY``
constraints are set to ``ON DELETE CASCADE``::

    >>> driver("""
    ... - { table: identity }
    ... - { link: identity.individual }
    ... - { column: identity.code, type: text }
    ... - { identity: [individual, code], of: identity }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "identity" ...
    ALTER TABLE "identity" ADD CONSTRAINT "identity_pk" PRIMARY KEY ("individual_id", "code"), CLUSTER ON "identity_pk";
    ALTER TABLE "identity" DROP CONSTRAINT "identity_individual_fk";
    ALTER TABLE "identity" ADD CONSTRAINT "identity_individual_fk" FOREIGN KEY ("individual_id") REFERENCES "individual" ("id") ON DELETE CASCADE;

It is an error if identity refers to an unknown table or a column::

    >>> driver("""{ identity: [sample.code] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered missing table:
        sample
    While deploying identity fact:
        "<unicode string>", line 1

    >>> driver("""{ identity: [individual.family, individual.code] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered missing field:
        family
    While deploying identity fact:
        "<unicode string>", line 1

If ``PRIMARY KEY`` already exists and is different from the given ``identity``,
the old ``PRIMARY KEY`` is deleted::

    >>> driver("""{ identity: [identity.individual] }""")
    ALTER TABLE "identity" DROP CONSTRAINT "identity_pk";
    ALTER TABLE "identity" ADD CONSTRAINT "identity_pk" PRIMARY KEY ("individual_id"), CLUSTER ON "identity_pk";


Identity generators
===================

The identity value can be generated automatically.  ``rex.deploy`` provides
two generators: *random* and *offset*.  To provide automatically generated
values, a trigger is created::

    >>> driver("""{ identity: [individual.code: random] }""")       # doctest: +ELLIPSIS
    CREATE OR REPLACE FUNCTION "individual_pk"() RETURNS "trigger" LANGUAGE plpgsql AS '
    BEGIN
        WHILE NEW."code" IS NULL LOOP
            ...
        END LOOP;
        RETURN NEW;
    END;
    ';
    CREATE TRIGGER "individual_pk" BEFORE INSERT ON "individual" FOR EACH ROW EXECUTE PROCEDURE "individual_pk"();
    COMMENT ON CONSTRAINT "individual_pk" ON "individual" IS '---
    generators:
    - random
    ';

Changing or removing the generator respectively updates or removes the
trigger::

    >>> driver("""{ identity: [individual.code: offset] }""")       # doctest: +ELLIPSIS
    CREATE OR REPLACE FUNCTION "individual_pk"() ...
    COMMENT ON CONSTRAINT "individual_pk" ON "individual" IS ...

    >>> driver("""{ identity: [individual.code] }""")
    DROP TRIGGER "individual_pk" ON "individual";
    DROP FUNCTION "individual_pk"();
    COMMENT ON CONSTRAINT "individual_pk" ON "individual" IS NULL;

Generators could be applied to *text* or *integer* columns::

    >>> driver("""
    ... - { table: individual }
    ... - { column: individual.code, type: text }
    ... - { identity: [individual.code: random] }
    ... 
    ... - { table: visit }
    ... - { link: visit.individual }
    ... - { column: visit.seq, type: integer }
    ... - { identity: [visit.individual, visit.seq: offset] }
    ... 
    ... - { table: measure_type }
    ... - { column: measure_type.uid, type: integer }
    ... - { identity: [measure_type.uid: random] }
    ... 
    ... - { table: measure }
    ... - { link: measure.individual }
    ... - { link: measure.measure_type }
    ... - { column: measure.no, type: text }
    ... - { column: measure.date_of_evaluation, type: date, default: today() }
    ... - { identity: [measure.individual, measure.measure_type, measure.no: offset] }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE OR REPLACE FUNCTION "individual_pk"() ...
    ...
    >>> driver.commit()

A random generator on an integer column creates numeric values with up to 9
digits::

    >>> from htsql import HTSQL
    >>> import re

    >>> db = HTSQL('pgsql:deploy_demo_identity', 'rex_deploy', 'tweak.etl')

    >>> measure_type_id1 = db.produce("insert(measure_type := {})").data
    >>> 1 <= measure_type_id1[0] <= 999999999
    True

    >>> measure_type_id2 = db.produce("insert(measure_type := {})").data
    >>> 1 <= measure_type_id2[0] <= 999999999
    True

A random generator on a text column creates a random sequence of letters
and numbers::

    >>> individual_id1 = db.produce("insert(individual := {})").data
    >>> bool(re.match(r'^[A-Z][0-9]{2}[A-Z][0-9]{4}$', individual_id1[0]))
    True

    >>> individual_id2 = db.produce("insert(individual := {})").data
    >>> bool(re.match(r'^[A-Z][0-9]{2}[A-Z][0-9]{4}$', individual_id2[0]))
    True

An offset generator for an integer column generates consequential values
starting from 1 grouped by other identity fields::

    >>> visit_id11 = db.produce("insert(visit := {individual := $individual_id})",
    ...                          individual_id=individual_id1).data
    >>> visit_id11 == (individual_id1, 1)
    True

    >>> visit_id12 = db.produce("insert(visit := {individual := $individual_id})",
    ...                          individual_id=individual_id1).data
    >>> visit_id12 == (individual_id1, 2)
    True

    >>> visit_id2 = db.produce("insert(visit := {individual := $individual_id})",
    ...                          individual_id=individual_id2).data
    >>> visit_id2 == (individual_id2, 1)
    True

An offset generator on a text column generates a sequence of numeric strings
starting from ``'001'`` and grouped by other identity fields::

    >>> measure_id111 = db.produce(
    ...         "insert(measure := {individual := $individual_id, measure_type := $measure_type_id})",
    ...         individual_id=individual_id1, measure_type_id=measure_type_id1).data
    >>> measure_id111 == (individual_id1, measure_type_id1, '001')
    True

    >>> measure_id112 = db.produce(
    ...         "insert(measure := {individual := $individual_id, measure_type := $measure_type_id})",
    ...         individual_id=individual_id1, measure_type_id=measure_type_id1).data
    >>> measure_id112 == (individual_id1, measure_type_id1, '002')
    True

    >>> measure_id12 = db.produce(
    ...         "insert(measure := {individual := $individual_id, measure_type := $measure_type_id})",
    ...         individual_id=individual_id1, measure_type_id=measure_type_id2).data
    >>> measure_id12 == (individual_id1, measure_type_id2, '001')
    True

    >>> measure_id21 = db.produce(
    ...         "insert(measure := {individual := $individual_id, measure_type := $measure_type_id})",
    ...         individual_id=individual_id2, measure_type_id=measure_type_id1).data
    >>> measure_id21 == (individual_id2, measure_type_id1, '001')
    True

    >>> db.produce("delete(/measure{id()})")
    <Product null>

It is an error to set a generator on a link or a column of incompatible type::

    >>> driver("""{ identity: [visit.individual: random, visit.seq] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer or text column:
        individual_id
    While deploying identity fact:
        "<unicode string>", line 1

    >>> driver("""{ identity: [measure.individual, measure.measure_type, measure.date_of_evaluation: offset] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer or text column:
        date_of_evaluation
    While deploying identity fact:
        "<unicode string>", line 1

Finally, we drop the test database::

    >>> driver.close()
    >>> cluster.drop()



