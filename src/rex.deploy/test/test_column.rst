*********************
  Deploying columns
*********************

.. contents:: Table of Contents


Parsing column record
=====================

Start with creating a test database and a driver::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_column')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

Column facts are denoted by field ``column``::

    >>> driver.parse("""{ column: individual.code, type: text }""")
    ColumnFact(u'individual', u'code', u'text', is_required=True)

The table of the column could be set in the ``column`` field
or as a separate ``of`` field::

    >>> driver.parse("""{ column: code, of: individual, type: text }""")
    ColumnFact(u'individual', u'code', u'text', is_required=True)

If the table is not set or set twice, an error is raised::

    >>> driver.parse("""{ column: code, type: text }""")
    Traceback (most recent call last):
      ...
    Error: Got missing table name
    While parsing:
        "<byte string>", line 1

    >>> driver.parse("""{ column: individual.code, of: identity, type: text }""")
    Traceback (most recent call last):
      ...
    Error: Got mismatched table names:
        individual, identity
    While parsing:
        "<byte string>", line 1

The ``type`` field is the name of the column type or a list of labels
of ``ENUM`` type::

    >>> driver.parse("""{ column: individual.sex, type: [male, female] }""")
    ColumnFact(u'individual', u'sex', [u'male', u'female'], is_required=True)

It is an error if the type is not specified or the type name is not recognized
or ``ENUM`` labels are not specified correctly::

    >>> driver.parse("""{ column: individual.sex }""")
    Traceback (most recent call last):
      ...
    Error: Got missing clause:
        type
    While parsing:
        "<byte string>", line 1

    >>> driver.parse("""{ column: individual.sex, type: [] }""")
    Traceback (most recent call last):
      ...
    Error: Got missing enum labels
    While parsing:
        "<byte string>", line 1

    >>> driver.parse("""{ column: individual.sex, type: [male, female, male] }""")
    Traceback (most recent call last):
      ...
    Error: Got duplicate enum labels:
        male, female, male
    While parsing:
        "<byte string>", line 1

By default, a column does not permit ``NULL`` values.  Turn off flag
``required`` to allow ``NULL`` values::

    >>> driver.parse("""{ column: individual.code, type: text, required: false }""")
    ColumnFact(u'individual', u'code', u'text', is_required=False)

Turn of flag ``present`` to indicate that the column should not exist::

    >>> driver.parse("""{ column: individual.code, present: false }""")
    ColumnFact(u'individual', u'code', is_present=False)

Field ``present: false`` cannot coexist with other column parameters::

    >>> driver.parse("""{ column: individual.code, type: text, present: false }""")
    Traceback (most recent call last):
      ...
    Error: Got unexpected clause:
        type
    While parsing:
        "<byte string>", line 1

    >>> driver.parse("""{ column: individual.code, required: true, present: false }""")
    Traceback (most recent call last):
      ...
    Error: Got unexpected clause:
        required
    While parsing:
        "<byte string>", line 1


Creating the column
===================

Deploying a column fact creates the column::

    >>> driver("""
    ... - { table: individual }
    ... - { column: individual.code, type: text }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "individual" ...
    ALTER TABLE "individual" ADD COLUMN "code" "text" NOT NULL;

    >>> schema = driver.get_schema()
    >>> individual_table = schema[u'individual']
    >>> u'code' in individual_table
    True

Deploying the same fact the second time has no effect::

    >>> driver("""{ column: individual.code, type: text }""")

If the driver cannot create the column because the column table does not exist
or the driver is locked, an error is raised::

    >>> driver("""{ column: identity.first_name, type: text }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing table:
        identity
    While deploying column fact:
        "<byte string>", line 1

    >>> driver("""{ column: individual.birth, type: date }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected missing column:
        birth
    While validating column fact:
        "<byte string>", line 1

When the column type is a list of ``ENUM`` labels, a corresponding ``ENUM``
type is created::

    >>> driver("""{ column: individual.sex, type: [male, female] }""")
    CREATE TYPE "individual_sex_enum" AS ENUM ('male', 'female');
    ALTER TABLE "individual" ADD COLUMN "sex" "individual_sex_enum" NOT NULL;
    >>> u'individual_sex_enum' in schema.types
    True

An error is raised when the driver is locked and cannot create a new type::

    >>> driver("""{ column: individual.status, type: [in-process, completed] }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected missing ENUM type:
        individual_status_enum
    While validating column fact:
        "<byte string>", line 1

In the future, if the column already exists, but does not match the column fact,
the column is altered to match the fact.  Currently, it's not yet functional::

    >>> driver("""{ column: individual.sex, type: [male, female, intersex] }""")
    Traceback (most recent call last):
      ...
    Error: Detected mismatched ENUM type:
        individual_sex_enum
    While deploying column fact:
        "<byte string>", line 1

    >>> driver("""{ column: individual.sex, type: text }""")
    Traceback (most recent call last):
      ...
    Error: Detected column with mismatched type:
        sex
    While deploying column fact:
        "<byte string>", line 1

    >>> driver("""{ column: individual.sex, type: [male, female], required: false }""")
    Traceback (most recent call last):
      ...
    Error: Detected column with mismatched NOT NULL constraint:
        sex
    While deploying column fact:
        "<byte string>", line 1

You cannot create a column if there is already a link with the same name::

    >>> driver("""
    ... - { link: individual.mother, to: individual }
    ... - { column: individual.mother, type: integer }
    ... """)
    Traceback (most recent call last):
      ...
    Error: Detected unexpected column
        mother_id
    While deploying column fact:
        "<byte string>", line 3


Dropping the column
===================

We can use column facts to drop a column::

    >>> driver("""{ column: individual.code, present: false }""")
    ALTER TABLE "individual" DROP COLUMN "code";

    >>> u'code' in individual_table
    False

Deploing the same fact again has no effect::

    >>> driver("""{ column: individual.code, present: false }""")

Deleting a column from a table which does not exist is NOOP::

    >>> driver("""{ column: measure.date_of_evaluation, present: false }""")

A locked driver cannot delete a column::

    >>> driver("""{ column: individual.sex, present: false }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected unexpected column:
        sex
    While validating column fact:
        "<byte string>", line 1

When you delete a column of ``ENUM`` type, the type is dropped too::

    >>> driver("""{ column: individual.sex, present: false }""")
    ALTER TABLE "individual" DROP COLUMN "sex";
    DROP TYPE "individual_sex_enum";
    >>> u'individual_sex_enum' in schema.types
    False

You cannot delete a column if there is a link with the same name::

    >>> driver("""{ column: individual.mother, present: false }""")
    Traceback (most recent call last):
      ...
    Error: Detected unexpected column
        mother_id
    While deploying column fact:
        "<byte string>", line 1

Finally, we drop the test database::

    >>> driver.close()
    >>> cluster.drop()


