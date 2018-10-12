*******************
  Deploying links
*******************

.. contents:: Table of Contents


Parsing link record
===================

Start with creating a test database and a driver::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_link')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

Link facts are denoted by field ``link``::

    >>> fact = driver.parse("""{ link: sample.individual }""")
    >>> fact
    LinkFact('sample', 'individual', 'individual')
    >>> print(fact)
    link: individual
    of: sample

The origin of the link could be set as a prefix of the ``link`` field
or as a separate ``of`` field::

    >>> fact = driver.parse("""{ link: individual, of: sample }""")
    >>> fact
    LinkFact('sample', 'individual', 'individual')
    >>> print(fact)
    link: individual
    of: sample

It is an error if ``link`` has no prefix and ``of`` is not specified.
It is also an error if they are both specified::

    >>> driver.parse("""{ link: individual }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got missing table name
    While parsing link fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ link: sample.individual, of: measure }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got mismatched table names:
        sample, measure
    While parsing link fact:
        "<unicode string>", line 1

The target of the link could be omitted if its name coincides with
the link name.  Otherwise, it could be set using ``to`` field::

    >>> fact = driver.parse("""{ link: individual.mother, to: individual }""")
    >>> fact
    LinkFact('individual', 'mother', 'individual')
    >>> print(fact)
    link: mother
    of: individual
    to: individual

You can indicate any old names of the link using ``was`` clause::

    >>> fact = driver.parse("""{ link: measure.individual, was: subject }""")
    >>> fact
    LinkFact('measure', 'individual', 'individual', former_labels=['subject'])
    >>> print(fact)
    link: individual
    of: measure
    was: [subject]

    >>> fact = driver.parse("""{ link: individual.birth_mother, was: [parent, mother], to: individual }""")
    >>> fact
    LinkFact('individual', 'birth_mother', 'individual', former_labels=['parent', 'mother'])
    >>> print(fact)
    link: birth_mother
    of: individual
    to: individual
    was: [parent, mother]

By default, a link does not permit ``NULL`` values.  Turn off flag
``required`` to allow ``NULL`` values::

    >>> fact = driver.parse("""{ link: sample.individual, required: false }""")
    >>> fact
    LinkFact('sample', 'individual', 'individual', is_required=False)
    >>> print(fact)
    link: individual
    of: sample
    required: false

You can explicitly specify the link title::

    >>> fact = driver.parse("""{ link: sample.individual, title: Subject }""")
    >>> fact
    LinkFact('sample', 'individual', 'individual', title='Subject')
    >>> print(fact)
    link: individual
    of: sample
    title: Subject

Turn off flag ``present`` to indicate that the link should not exist::

    >>> fact = driver.parse("""{ link: individual.code, present: false }""")
    >>> fact
    LinkFact('individual', 'code', is_present=False)
    >>> print(fact)
    link: code
    of: individual
    present: false

Field ``present: false`` cannot coexist with other link parameters::

    >>> driver.parse("""{ link: individual.mother, to: individual, present: false }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unexpected clause:
        to
    While parsing link fact:
        "<unicode string>", line 1


Creating the link
=================

Deploying a link fact creates a column and a foreign key::

    >>> driver("""
    ... - { table: individual }
    ... - { table: sample }
    ... - { link: sample.individual }
    ... - { column: sample.code, type: text }
    ... - { identity: [sample.individual, sample.code: offset] }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "individual" ...
    CREATE TABLE "sample" ...
    ALTER TABLE "sample" ADD COLUMN "individual_id" "int4" NOT NULL;
    ALTER TABLE "sample" ADD CONSTRAINT "sample_individual_fk" FOREIGN KEY ("individual_id") REFERENCES "individual" ("id") ON DELETE SET DEFAULT;
    CREATE INDEX "sample_individual_fk" ON "sample" ("individual_id");
    ...

    >>> schema = driver.get_schema()
    >>> sample_table = schema['sample']
    >>> 'individual_id' in sample_table
    True

Deploying the same fact the second time has no effect::

    >>> driver("""{ link: sample.individual }""")

The title of the link is stored in the column comment::

    >>> driver("""{ link: sample.individual, title: Subject }""")
    COMMENT ON COLUMN "sample"."individual_id" IS '---
    title: Subject
    ';

You can specify the default value for a link field.  For this to work,
the target table must have an identity::

    >>> driver("""
    ... - { table: site }
    ... - { column: site.code, type: text }
    ... - { link: individual.site, default: main }
    ... """)                                            # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Got ill-formed link value:
        site[main]
    While deploying link fact:
        "<unicode string>", line 4

As well as the target row must exist::

    >>> driver("""
    ... - { identity: [site.code] }
    ... - { link: individual.site, default: main }
    ... """)                                            # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Cannot find link:
        site[main]
    While deploying link fact:
        "<unicode string>", line 3

It is an error if the link value is malformed::

    >>> driver("""
    ... - { data: { code: main }, of: site }
    ... - { link: individual.site, default: main.1 }
    ... """)                                            # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Got ill-formed link value:
        site[main.1]
    While deploying link fact:
        "<unicode string>", line 3

If the target row exists, the default value can be set::

    >>> driver("""
    ... { link: individual.site, default: main }
    ... """)                                            # doctest: +ELLIPSIS
    ALTER TABLE "individual" ADD COLUMN "site_id" "int4" NOT NULL DEFAULT 1;
    ...
    COMMENT ON COLUMN "individual"."site_id" IS '---
    default: main
    ';

Unsetting the default value removes it::

    >>> driver("""{ link: individual.site }""")
    ALTER TABLE "individual" ALTER COLUMN "site_id" DROP DEFAULT;
    COMMENT ON COLUMN "individual"."site_id" IS NULL;

The driver cannot create the link if either the origin or the target
table does not exist::

    >>> driver("""{ link: measure.individual }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered missing table:
        measure
    While deploying link fact:
        "<unicode string>", line 1

    >>> driver("""{ link: individual.family }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered missing table:
        family
    While deploying link fact:
        "<unicode string>", line 1

If the link is self-referential, it must be optional::

    >>> driver("""{ link: individual.mother, to: individual }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Detected self-referential mandatory link:
        mother
    While deploying link fact:
        "<unicode string>", line 1

    >>> driver("""{ link: individual.mother, to: individual, required: false }""")
    ALTER TABLE "individual" ADD COLUMN "mother_id" "int4";
    ALTER TABLE "individual" ADD CONSTRAINT "individual_mother_fk" FOREIGN KEY ("mother_id") REFERENCES "individual" ("id") ON DELETE SET DEFAULT;
    CREATE INDEX "individual_mother_fk" ON "individual" ("mother_id");

    >>> driver("""{ link: individual.mother, to: individual }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Detected self-referential mandatory link:
        mother
    While deploying link fact:
        "<unicode string>", line 1

An error is raised if the target table has no ``id`` column::

    >>> driver.submit("""CREATE TABLE family (familyid int4 NOT NULL);""")
    CREATE TABLE family (familyid int4 NOT NULL);
    >>> driver.reset()
    >>> driver("""{ link: individual.family }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered table without surrogate key:
        family
    While deploying link fact:
        "<unicode string>", line 1

If the link column exists, the driver verifies that is has a correct type and
``NOT NULL`` constraint and, if necessary, changes them::

    >>> driver("""{ link: sample.individual, title: Subject, required: false }""")
    ALTER TABLE "sample" DROP CONSTRAINT "sample_pk";
    DROP TRIGGER "sample_pk" ON "sample";
    DROP FUNCTION "sample_pk"();
    ALTER TABLE "sample" DROP CONSTRAINT "sample_individual_fk";
    ALTER TABLE "sample" ADD CONSTRAINT "sample_individual_fk" FOREIGN KEY ("individual_id") REFERENCES "individual" ("id") ON DELETE SET DEFAULT;
    ALTER TABLE "sample" ALTER COLUMN "individual_id" DROP NOT NULL;

Similarly, it may apply a ``UNIQUE`` constraint::

    >>> driver("""{ link: sample.individual, title: Subject, unique: true }""")
    ALTER TABLE "sample" ALTER COLUMN "individual_id" SET NOT NULL;
    DROP INDEX "sample_individual_fk";
    ALTER TABLE "sample" ADD CONSTRAINT "sample_individual_uk" UNIQUE ("individual_id");

    >>> driver("""{ link: sample.individual, title: Subject, unique: false }""")
    ALTER TABLE "sample" DROP CONSTRAINT "sample_individual_uk";
    CREATE INDEX "sample_individual_fk" ON "sample" ("individual_id");

You cannot create a link if there is a regular column with the same name::

    >>> driver("""
    ... - { table: identity }
    ... - { column: identity.individual, type: text }
    ... - { link: identity.individual }
    ... """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered column with the same name:
        individual
    While deploying link fact:
        "<unicode string>", line 4


Renaming the link
=================

To rename a link, specify the current name as ``was`` field and the new name as
``link`` field::

    >>> driver("""{ link: sample.subject, to: individual, was: individual }""")
    ALTER TABLE "sample" RENAME COLUMN "individual_id" TO "subject_id";
    ALTER TABLE "sample" RENAME CONSTRAINT "sample_individual_fk" TO "sample_subject_fk";
    ALTER INDEX "sample_individual_fk" RENAME TO "sample_subject_fk";
    COMMENT ON COLUMN "sample"."subject_id" IS NULL;

Applying the same fact second time will have no effect::

    >>> driver("""{ link: sample.subject, to: individual, was: individual }""")


Dropping the link
=================

We can use link facts to drop a ``FOREIGN KEY`` constraint and associated
column::

    >>> driver("""{ link: sample.subject, present: false }""")
    ALTER TABLE "sample" DROP COLUMN "subject_id";

    >>> schema = driver.get_schema()
    >>> sample_table = schema['sample']
    >>> 'individual_id' in sample_table
    False

Deploing the same fact again has no effect::

    >>> driver("""{ link: sample.subject, present: false }""")

Deleting a link from a table which does not exist is NOOP::

    >>> driver("""{ link: measure.subject, present: false }""")

You cannot delete a link if there is a regular column with the same name::

    >>> driver("""{ link: identity.individual, present: false }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered column with the same name:
        individual
    While deploying link fact:
        "<unicode string>", line 1

Finally, we drop the test database::

    >>> driver.close()
    >>> cluster.drop()



