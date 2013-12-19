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

    >>> driver.parse("""{ link: sample.individual }""")
    LinkFact(u'sample', u'individual', u'individual', is_required=True)

The origin of the link could be set as a prefix of the ``link`` field
or as a separate ``of`` field::

    >>> driver.parse("""{ link: individual, of: sample }""")
    LinkFact(u'sample', u'individual', u'individual', is_required=True)

It is an error if ``link`` has no prefix and ``of`` is not specified.
It is also an error if they are both specified::

    >>> driver.parse("""{ link: individual }""")
    Traceback (most recent call last):
      ...
    Error: Got missing table name
    While parsing link fact:
        "<byte string>", line 1

    >>> driver.parse("""{ link: sample.individual, of: measure }""")
    Traceback (most recent call last):
      ...
    Error: Got mismatched table names:
        sample, measure
    While parsing link fact:
        "<byte string>", line 1

The target of the link could be omitted if its name coincides with
the link name.  Otherwise, it could be set using ``to`` field::

    >>> driver.parse("""{ link: individual.mother, to: individual }""")
    LinkFact(u'individual', u'mother', u'individual', is_required=True)

By default, a link does not permit ``NULL`` values.  Turn off flag
``required`` to allow ``NULL`` values::

    >>> driver.parse("""{ link: sample.individual, required: false }""")
    LinkFact(u'sample', u'individual', u'individual', is_required=False)

Turn off flag ``present`` to indicate that the link should not exist::

    >>> driver.parse("""{ link: individual.code, present: false }""")
    LinkFact(u'individual', u'code', is_present=False)

Field ``present: false`` cannot coexist with other link parameters::

    >>> driver.parse("""{ link: individual.mother, to: individual, present: false }""")
    Traceback (most recent call last):
      ...
    Error: Got unexpected clause:
        to
    While parsing link fact:
        "<byte string>", line 1

    >>> driver.parse("""{ link: individual.code, required: true, present: false }""")
    Traceback (most recent call last):
      ...
    Error: Got unexpected clause:
        required
    While parsing link fact:
        "<byte string>", line 1


Creating the link
=================

Deploying a link fact creates a column and a foreign key::

    >>> driver("""
    ... - { table: individual }
    ... - { table: sample }
    ... - { link: sample.individual }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "individual" ...
    CREATE TABLE "sample" ...
    ALTER TABLE "sample" ADD COLUMN "individual_id" "int4" NOT NULL;
    ALTER TABLE "sample" ADD CONSTRAINT "sample_individual_fk" FOREIGN KEY ("individual_id") REFERENCES "individual" ("id");

    >>> schema = driver.get_schema()
    >>> sample_table = schema[u'sample']
    >>> u'individual_id' in sample_table
    True

Deploying the same fact the second time has no effect::

    >>> driver("""{ link: sample.individual }""")

The driver cannot create the link if either the origin or the target
table does not exist, or if the driver is locked::

    >>> driver("""{ link: measure.individual }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing table:
        measure
    While deploying link fact:
        "<byte string>", line 1

    >>> driver("""{ link: individual.family }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing table:
        family
    While deploying link fact:
        "<byte string>", line 1

    >>> driver("""{ link: individual.mother, to: individual }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected missing column:
        mother_id
    While validating link fact:
        "<byte string>", line 1

An error is raised if the target table has no ``id`` column::

    >>> driver.submit("""CREATE TABLE family (familyid int4 NOT NULL);""")
    CREATE TABLE family (familyid int4 NOT NULL);
    >>> driver.reset()
    >>> driver("""{ link: individual.family }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing column:
        id
    While deploying link fact:
        "<byte string>", line 1

If the link column exists, the driver verifies that is has a
correct type and ``NOT NULL`` constraint::

    >>> driver.submit("""ALTER TABLE individual ADD COLUMN mother_id text NOT NULL;""")
    ALTER TABLE individual ADD COLUMN mother_id text NOT NULL;
    >>> driver.reset()
    >>> driver("""{ link: individual.mother, to: individual }""")
    Traceback (most recent call last):
      ...
    Error: Detected column with mismatched type:
        mother_id
    While deploying link fact:
        "<byte string>", line 1

    >>> driver("""{ link: sample.individual, required: false }""")
    Traceback (most recent call last):
      ...
    Error: Detected column with mismatched NOT NULL constraint:
        individual_id
    While deploying link fact:
        "<byte string>", line 1

It also verifies that the ``FOREIGN KEY`` constraint exists::

    >>> driver.submit("""ALTER TABLE individual ADD COLUMN father_id int4 NOT NULL;""")
    ALTER TABLE individual ADD COLUMN father_id int4 NOT NULL;
    >>> driver.reset()
    >>> driver("""{ link: individual.father, to: individual }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected column with missing FOREIGN KEY constraint:
        father_id
    While validating link fact:
        "<byte string>", line 1

You cannot create a link if there is a regular column with the same name::

    >>> driver("""
    ... - { table: identity }
    ... - { column: identity.individual, type: text }
    ... - { link: identity.individual }
    ... """)
    Traceback (most recent call last):
      ...
    Error: Detected unexpected column
        individual
    While deploying link fact:
        "<byte string>", line 4


Dropping the link
=================

We can use link facts to drop a ``FOREIGN KEY`` constraint and associated
column::

    >>> driver("""{ link: sample.individual, present: false }""")
    ALTER TABLE "sample" DROP COLUMN "individual_id";

    >>> schema = driver.get_schema()
    >>> sample_table = schema[u'sample']
    >>> u'individual_id' in sample_table
    False

Deploing the same fact again has no effect::

    >>> driver("""{ link: sample.individual, present: false }""")

Deleting a link from a table which does not exist is NOOP::

    >>> driver("""{ link: measure.individual, present: false }""")

A locked driver cannot delete a link::

    >>> driver("""{ link: individual.father, present: false }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected unexpected column:
        father_id
    While validating link fact:
        "<byte string>", line 1

You cannot delete a link if there is a regular column with the same name::

    >>> driver("""{ link: identity.individual, present: false }""")
    Traceback (most recent call last):
      ...
    Error: Detected unexpected column
        individual
    While deploying link fact:
        "<byte string>", line 1

Finally, we drop the test database::

    >>> driver.close()
    >>> cluster.drop()


