*********************
  SQL Serialization
*********************

.. contents:: Table of Contents


Name mangling
=============

Use function ``mangle()`` to assemble a valid SQL name from one or more
fragments::

    >>> from rex.deploy import mangle

    >>> mangle(u'individual')
    u'individual'
    >>> mangle([u'individual', u'mother'])
    u'individual_mother'

You can specify a suffix::

    >>> mangle([u'individual', u'mother'], u'fk')
    u'individual_mother_fk'

The separator is always large enough so that it is not contained in any of the
fragments::

    >>> mangle([u'individual', u'adopted_father'])
    u'individual__adopted_father'

Names which could collide with some other generated name are mangled::

    >>> mangle(u'remote_id')
    u'remote_id__161172'

Names that are too long are truncated and mangled as well::

    >>> mangle([u'very']+[u'long']*100+[u'name'])
    u'very_long_long___long_long_long_long_long_long_long_name_6c78ff'
    >>> len(_)
    63


Quoting names and values
========================

Use function ``sql_name()`` to quote SQL identifiers::

    >>> from rex.deploy import sql_name

    >>> print sql_name(u'individual')
    "individual"

The ``"`` character is properly escaped::

    >>> print sql_name('"name in quotes"')
    """name in quotes"""

``sql_name()`` also accepts a list of identifiers and produces a
comma-separated sequence::

    >>> print sql_name([u'code', u'title'])
    "code", "title"

Use function ``sql_value()`` to make a SQL literal::

    >>> from rex.deploy import sql_value

    >>> print sql_value(u'Hello World!')
    'Hello World!'

``sql_value()`` converts ``None``, ``True`` and ``False`` to appropriate SQL
constants::

    >>> print sql_value(None)
    NULL
    >>> print sql_value(True)
    TRUE
    >>> print sql_value(False)
    FALSE

``sql_value()`` accepts numeric values of different types::

    >>> print sql_value(3)
    3
    >>> print sql_value(3.0)
    3.0
    >>> import decimal
    >>> print sql_value(decimal.Decimal('3.0'))
    3.0

Date, time and datetime values are also accepted::

    >>> import datetime
    >>> print sql_value(datetime.date(2010, 4, 15))
    '2010-04-15'
    >>> print sql_value(datetime.time(20, 13))
    '20:13:00'
    >>> print sql_value(datetime.datetime(2010, 4, 15, 20, 13))
    '2010-04-15 20:13:00'

Text values are escaped properly::

    >>> print sql_value(u'RexDB')
    'RexDB'
    >>> print sql_value(u'O\'Rex')
    'O''Rex'
    >>> print sql_value(u'\\Rex')
    E'\\Rex'

A list is converted to a comma-separated sequence::

    >>> print sql_value([u'male', u'female', u'intersex'])
    'male', 'female', 'intersex'

Values of any other type are rejected::

    >>> print sql_value({})
    Traceback (most recent call last):
      ...
    NotImplementedError: sql_value() is not implemented for values of type dict


Database management
===================

``rex.deploy`` can generate SQL for creating and destroying databases::

    >>> from rex.deploy import sql_create_database, sql_drop_database, \
    ...                        sql_select_database

    >>> print sql_create_database(u'deploy_demo')
    CREATE DATABASE "deploy_demo" WITH ENCODING = 'UTF-8';
    >>> print sql_drop_database(u'deploy_demo')
    DROP DATABASE "deploy_demo";
    >>> print sql_select_database(u'deploy_demo')
    SELECT TRUE FROM pg_catalog.pg_database AS d WHERE d.datname = 'deploy_demo';


Tables, columns, and constraints
================================

With ``rex.deploy``, you can generate a ``CREATE TABLE`` and ``DROP TABLE``
statement::

    >>> from rex.deploy import sql_create_table, sql_define_column, \
    ...                        sql_drop_table

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

    >>> print sql_drop_table(u'study')
    DROP TABLE "study";

You can configure some table properties when generating ``CREATE TABLE``
statement::

    >>> print sql_create_table(u'study', body, is_unlogged=True)
    CREATE UNLOGGED TABLE "study" (
        "id" "serial4" NOT NULL,
        "code" "varchar"(8) NOT NULL,
        "title" "text"
    );

``rex.deploy`` can also generate ``ALTER TABLE`` statements to add and remove
columns and constraints::

    >>> from rex.deploy import sql_add_column, sql_drop_column, \
    ...                        sql_add_unique_constraint, \
    ...                        sql_add_foreign_key_constraint, \
    ...                        sql_drop_constraint

    >>> print sql_add_column(u'study', u'code', (u'varchar', 8), True)
    ALTER TABLE "study" ADD COLUMN "code" "varchar"(8) NOT NULL;
    >>> print sql_add_column(u'study', u'title', u'text', False)
    ALTER TABLE "study" ADD COLUMN "title" "text";
    >>> print sql_drop_column(u'study', u'closed')
    ALTER TABLE "study" DROP COLUMN "closed";

    >>> uk_name = mangle([u'study', u'id'], u'uk')
    >>> print sql_add_unique_constraint(u'study', uk_name, [u'id'], False)
    ALTER TABLE "study" ADD CONSTRAINT "study_id_uk" UNIQUE ("id");
    >>> pk_name = mangle(u'study', u'pk')
    >>> print sql_add_unique_constraint(u'study', pk_name, [u'code'], True)
    ALTER TABLE "study" ADD CONSTRAINT "study_pk" PRIMARY KEY ("code");

    >>> fk_name = mangle([u'case', u'study'], u'fk')
    >>> print sql_add_foreign_key_constraint(u'case', fk_name, [u'study_id'],
    ...                                      u'study', [u'id'])
    ALTER TABLE "case" ADD CONSTRAINT "case_study_fk" FOREIGN KEY ("study_id") REFERENCES "study" ("id");

    >>> print sql_drop_constraint(u'case', fk_name)
    ALTER TABLE "case" DROP CONSTRAINT "case_study_fk";


Data types
==========

``rex.deploy`` can create and drop types::

    >>> from rex.deploy import sql_create_enum_type, sql_drop_type

    >>> enum_name = mangle([u'individual', u'sex'], u'enum')
    >>> print sql_create_enum_type(enum_name, [u'male', u'female', u'intersex'])
    CREATE TYPE "individual_sex_enum" AS ENUM ('male', 'female', 'intersex');

    >>> print sql_drop_type(enum_name)
    DROP TYPE "individual_sex_enum";


Comments
========

``rex.deploy`` allows you to add and remove comments for schemas, tables,
columns, types and constraints::

    >>> from rex.deploy import (sql_comment_on_schema, sql_comment_on_table,
    ...     sql_comment_on_column, sql_comment_on_constraint, sql_comment_on_type)

    >>> print sql_comment_on_schema(u'public', None)
    COMMENT ON SCHEMA "public" IS NULL;

    >>> print sql_comment_on_table(u'individual', u'Test Subjects')
    COMMENT ON TABLE "individual" IS 'Test Subjects';

    >>> print sql_comment_on_column(u'individual', u'sex', u'Sex (M/F/I)')
    COMMENT ON COLUMN "individual"."sex" IS 'Sex (M/F/I)';

    >>> print sql_comment_on_constraint(u'individual', u'individual_pk',
    ...                                 u'Surrogate primary key')
    COMMENT ON CONSTRAINT "individual_pk" ON "individual" IS 'Surrogate primary key';

    >>> print sql_comment_on_type(u'individual_sex_enum', u'Sex (M/F/I)')
    COMMENT ON TYPE "individual_sex_enum" IS 'Sex (M/F/I)';


``SELECT``, ``INSERT``, ``UPDATE``, ``DELETE``
==============================================

``rex.deploy`` can generate a ``SELECT`` statement to fetch all rows from a
table::

    >>> from rex.deploy import sql_select

    >>> print sql_select(u'study', [u'id', u'code', u'title'])
    SELECT "id", "code", "title"
        FROM "study";

``rex.deploy`` can generate a simple ``INSERT`` statement with a ``RETURNING``
clause::

    >>> from rex.deploy import sql_insert

    >>> print sql_insert(u'study', [u'code', u'title'],
    ...                  [u'fos', u'Family Obesity Study'],
    ...                  [u'id', u'code', u'title'])
    INSERT INTO "study" ("code", "title")
        VALUES ('fos', 'Family Obesity Study')
        RETURNING "id", "code", "title";

You can also generate ``INSERT`` without specifying any values::

    >>> print sql_insert(u'study', [], [])
    INSERT INTO "study"
        DEFAULT VALUES;

Similarly, ``rex.deploy`` can generate ``UPDATE`` and ``DELETE`` statements to
modify or delete a single row::

    >>> from rex.deploy import sql_update, sql_delete

    >>> print sql_update(u'study', u'id', 1, [u'code', u'title'],
    ...                  [u'fos', u'Family Obesity Study'],
    ...                  [u'id', u'code', u'title'])
    UPDATE "study"
        SET "code" = 'fos', "title" = 'Family Obesity Study'
        WHERE "id" = 1
        RETURNING "id", "code", "title";

    >>> print sql_update(u'study', u'id', 2, [], [])
    UPDATE "study"
        SET "id" = 2
        WHERE "id" = 2;

    >>> print sql_delete(u'study', u'id', 3)
    DELETE FROM "study"
        WHERE "id" = 3;


