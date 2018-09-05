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

    >>> fact = driver.parse("""{ column: individual.code, type: text }""")
    >>> fact
    ColumnFact('individual', 'code', 'text')
    >>> print(fact)
    column: code
    of: individual
    type: text

The table of the column could be set in the ``column`` field
or as a separate ``of`` field::

    >>> fact = driver.parse("""{ column: code, of: individual, type: text }""")
    >>> fact
    ColumnFact('individual', 'code', 'text')
    >>> print(fact)
    column: code
    of: individual
    type: text

If the table is not set or set twice, an error is raised::

    >>> driver.parse("""{ column: code, type: text }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got missing table name
    While parsing column fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ column: individual.code, of: identity, type: text }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got mismatched table names:
        individual, identity
    While parsing column fact:
        "<unicode string>", line 1

You could indicate possible old names of the column using ``was`` field::

    >>> fact = driver.parse("""{ column: identity.last_name, was: [surname], type: text }""")
    >>> fact
    ColumnFact('identity', 'last_name', 'text', former_labels=['surname'])
    >>> print(fact)
    column: last_name
    of: identity
    was: [surname]
    type: text

    >>> fact = driver.parse("""{ column: identity.date_of_birth, was: [dob, birth], type: date }""")
    >>> fact
    ColumnFact('identity', 'date_of_birth', 'date', former_labels=['dob', 'birth'])
    >>> print(fact)
    column: date_of_birth
    of: identity
    was: [dob, birth]
    type: date

The ``type`` field is the name of the column type or a list of labels
of ``ENUM`` type::

    >>> fact = driver.parse("""{ column: individual.sex, type: [male, female] }""")
    >>> fact
    ColumnFact('individual', 'sex', ['male', 'female'])
    >>> print(fact)
    column: sex
    of: individual
    type: [male, female]

It is an error if the type is not specified or the type name is not recognized
or ``ENUM`` labels are not specified correctly::

    >>> driver.parse("""{ column: individual.sex }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got missing clause:
        type
    While parsing column fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ column: individual.sex, type: [] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got missing enum labels
    While parsing column fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ column: individual.sex, type: [male, female, male] }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got duplicate enum labels:
        male, female, male
    While parsing column fact:
        "<unicode string>", line 1

You can set the default value of the column::

    >>> fact = driver.parse("""{ column: study.closed, type: boolean, default: false }""")
    >>> fact
    ColumnFact('study', 'closed', 'boolean', default=False)
    >>> print(fact)
    column: closed
    of: study
    type: boolean
    default: false

The default value must be compatible with the column type::

    >>> driver.parse("""{ column: individual.sex, type: [male, female], default: not-known }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got ill-typed default value:
        not-known
    While parsing column fact:
        "<unicode string>", line 1

By default, a column does not permit ``NULL`` values.  Turn off flag
``required`` to allow ``NULL`` values::

    >>> fact = driver.parse("""{ column: individual.code, type: text, required: false }""")
    >>> fact
    ColumnFact('individual', 'code', 'text', is_required=False)
    >>> print(fact)
    column: code
    of: individual
    type: text
    required: false

You can also declare that the column value must be unique across all rows in
the table::

    >>> fact = driver.parse("""{ column: user.email, type: text, unique: true }""")
    >>> fact
    ColumnFact('user', 'email', 'text', is_unique=True)
    >>> print(fact)
    column: email
    of: user
    type: text
    unique: true

Use field ``title`` to specify the column title::

    >>> fact = driver.parse("""{ column: individual.code, type: text, title: Individual ID }""")
    >>> fact
    ColumnFact('individual', 'code', 'text', title='Individual ID')
    >>> print(fact)
    column: code
    of: individual
    type: text
    title: Individual ID

Turn off flag ``present`` to indicate that the column should not exist::

    >>> fact = driver.parse("""{ column: individual.code, present: false }""")
    >>> fact
    ColumnFact('individual', 'code', is_present=False)
    >>> print(fact)
    column: code
    of: individual
    present: false

Field ``present: false`` cannot coexist with other column parameters::

    >>> driver.parse("""{ column: individual.code, type: text, present: false }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unexpected clause:
        type
    While parsing column fact:
        "<unicode string>", line 1


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
    >>> individual_table = schema['individual']
    >>> 'code' in individual_table
    True

Deploying the same fact the second time has no effect::

    >>> driver("""{ column: individual.code, type: text }""")

The title of the column is stored in the column comment::

    >>> driver("""{ column: individual.code, type: text, title: Individual ID }""")
    COMMENT ON COLUMN "individual"."code" IS '---
    title: Individual ID
    ';

If the driver cannot create the column because the column table does not exist,
an error is raised::

    >>> driver("""{ column: identity.first_name, type: text }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered missing table:
        identity
    While deploying column fact:
        "<unicode string>", line 1

When the column type is a list of ``ENUM`` labels, a corresponding ``ENUM``
type is created::

    >>> driver("""{ column: individual.sex, type: [not-known, male, female] }""")
    CREATE TYPE "individual_sex_enum" AS ENUM ('not-known', 'male', 'female');
    ALTER TABLE "individual" ADD COLUMN "sex" "individual_sex_enum" NOT NULL;
    >>> 'individual_sex_enum' in schema.types
    True

You can declare that column values must be unique across all rows in the table::

    >>> driver("""{ column: individual.email, type: text, unique: true }""")
    ALTER TABLE "individual" ADD COLUMN "email" "text" NOT NULL;
    ALTER TABLE "individual" ADD CONSTRAINT "individual_email_uk" UNIQUE ("email");

You can create a column with a default value::

    >>> driver("""{ column: individual.birth_date, type: date, default: today() }""")
    ALTER TABLE "individual" ADD COLUMN "birth_date" "date" NOT NULL DEFAULT 'now'::text::date;
    COMMENT ON COLUMN "individual"."birth_date" IS '---
    default: today()
    ';

You can also set the default value of an existing column::

    >>> driver("""{ column: individual.sex, type: [not-known, male, female], default: not-known }""")
    ALTER TABLE "individual" ALTER COLUMN "sex" SET DEFAULT 'not-known';
    COMMENT ON COLUMN "individual"."sex" IS '---
    default: not-known
    ';

You can alter the ``NOT NULL`` and ``UNIQUE`` constraints on the column, but
only if the driver is not locked.  Notably, a column without ``NOT NULL``
constraint cannot be a part of the ``PRIMARY KEY`` of the table::

    >>> driver("""{ identity: [individual.code] }""")
    ALTER TABLE "individual" ADD CONSTRAINT "individual_pk" PRIMARY KEY ("code"), CLUSTER ON "individual_pk";

    >>> driver("""{ column: individual.code, type: text, title: Individual ID, required: false }""")
    ALTER TABLE "individual" DROP CONSTRAINT "individual_pk";
    ALTER TABLE "individual" ALTER COLUMN "code" DROP NOT NULL;

    >>> driver("""{ column: individual.code, type: text, title: Individual ID, required: true }""")
    ALTER TABLE "individual" ALTER COLUMN "code" SET NOT NULL;

    >>> driver("""{ column: individual.email, type: text, unique: false }""")
    ALTER TABLE "individual" DROP CONSTRAINT "individual_email_uk";

    >>> driver("""{ column: individual.email, type: text, unique: true }""")
    ALTER TABLE "individual" ADD CONSTRAINT "individual_email_uk" UNIQUE ("email");

You cannot create a column if there is already a link with the same name::

    >>> driver("""
    ... - { link: individual.mother, to: individual, required: false }
    ... - { column: individual.mother, type: integer }
    ... """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered link with the same name:
        mother
    While deploying column fact:
        "<unicode string>", line 3


Renaming the column
===================

If you want to rename an existing column, specify the current name as ``was``
field.  As the column is renamed, associated types and constraints are renamed
as well::

    >>> driver("""{ column: individual.gender, was: sex, type: [not-known, male, female], default: not-known }""")
    ALTER TABLE "individual" RENAME COLUMN "sex" TO "gender";
    ALTER TYPE "individual_sex_enum" RENAME TO "individual_gender_enum";

    >>> driver("""{ column: individual.login_email, was: email, type: text, unique: true }""")
    ALTER TABLE "individual" RENAME COLUMN "email" TO "login_email";
    ALTER TABLE "individual" RENAME CONSTRAINT "individual_email_uk" TO "individual__login_email__uk";

If you rename a column that is part of table identity, the corresponding
identity trigger will be rebuilt::

    >>> driver("""{ identity: [individual.code: random] }""")       # doctest: +ELLIPSIS
    ALTER TABLE "individual" ADD CONSTRAINT "individual_pk" PRIMARY KEY ("code"), CLUSTER ON "individual_pk";
    ...

    >>> driver("""{ column: individual.ident, was: code, type: text }""")   # doctest: +ELLIPSIS
    ALTER TABLE "individual" RENAME COLUMN "code" TO "ident";
    COMMENT ON COLUMN "individual"."ident" IS NULL;
    CREATE OR REPLACE FUNCTION "individual_pk"() RETURNS "trigger" LANGUAGE plpgsql AS '
    BEGIN
        WHILE NEW."ident" IS NULL LOOP
            ...
        END LOOP;
        RETURN NEW;
    END;
    ';


Converting the column
=====================

It is possible to change the type of the column.  First, we create a text
column::

    >>> driver("""
    ... - { table: address }
    ... - { column: address.code, type: text }
    ... - { identity: [address.code] }
    ... - { column: address.city, type: text }
    ... - { column: address.zip, type: text }
    ... - { column: address.state, type: text }
    ... - { data: [{ code: chi, city: Chicago, zip: '60614', state: IL }], of: address }
    ... """)                # doctest: +ELLIPSIS
    CREATE TABLE "address" ...

    >>> zip_table = schema['address']
    >>> zip_key = zip_table.primary_key
    >>> zip_table.select()
    SELECT "id", "code", "city", "zip", "state"
        FROM "address";
    <DataImage address>

    >>> zip_table.data.get(zip_key, ('chi',))
    (1, 'chi', 'Chicago', '60614', 'IL')

Then we could convert the ``zip`` column to integer::

    >>> driver("""{ column: address.zip, type: integer }""")
    ALTER TABLE "address" ALTER COLUMN "zip" SET DATA TYPE "int8" USING "zip"::"int8";

    >>> zip_table.select()
    SELECT "id", "code", "city", "zip", "state"
        FROM "address";
    <DataImage address>

    >>> zip_table.data.get(zip_key, ('chi',))
    (1, 'chi', 'Chicago', 60614, 'IL')

We can also convert a column to an ``ENUM`` type::

    >>> driver("""{ column: address.state, type: [IL] }""")
    CREATE TYPE "address_state_enum" AS ENUM ('IL');
    ALTER TABLE "address" ALTER COLUMN "state" SET DATA TYPE "address_state_enum" USING "state"::"address_state_enum";

We can add more labels to an ``ENUM`` type too::

    >>> driver("""{ column: address.state, type: [IL, MI] }""")
    CREATE TYPE "?" AS ENUM ('IL', 'MI');
    ALTER TABLE "address" ALTER COLUMN "state" SET DATA TYPE "?" USING "state"::"text"::"?";
    DROP TYPE "address_state_enum";
    ALTER TYPE "?" RENAME TO "address_state_enum";

Or convert an ``ENUM`` column into text::

    >>> driver("""{ column: address.state, type: text }""")
    ALTER TABLE "address" ALTER COLUMN "state" SET DATA TYPE "text" USING "state"::"text";
    DROP TYPE "address_state_enum";

Unsupported conversions are rejected::

    >>> driver("""{ column: address.zip, type: date }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Cannot convert column of type integer to date:
        zip
    While deploying column fact:
        "<unicode string>", line 1


Dropping the column
===================

We can use column facts to drop a column::

    >>> driver("""{ column: individual.ident, present: false }""")
    ALTER TABLE "individual" DROP COLUMN "ident";
    DROP TRIGGER "individual_pk" ON "individual";
    DROP FUNCTION "individual_pk"();

    >>> 'ident' in individual_table
    False

Deploing the same fact again has no effect::

    >>> driver("""{ column: individual.ident, present: false }""")

Deleting a column from a table which does not exist is NOOP::

    >>> driver("""{ column: measure.date_of_evaluation, present: false }""")

When you delete a column of ``ENUM`` type, the type is dropped too::

    >>> driver("""{ column: individual.gender, present: false }""")
    ALTER TABLE "individual" DROP COLUMN "gender";
    DROP TYPE "individual_gender_enum";
    >>> 'individual_gender_enum' in schema.types
    False

You cannot delete a column if there is a link with the same name::

    >>> driver("""{ column: individual.mother, present: false }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Discovered link with the same name:
        mother
    While deploying column fact:
        "<unicode string>", line 1

Finally, we drop the test database::

    >>> driver.close()
    >>> cluster.drop()



