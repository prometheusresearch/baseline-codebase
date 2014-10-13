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

You can also generate a SQL expression for the current date and timestamp::

    >>> print sql_value(datetime.date.today)
    'now'::text::date
    >>> print sql_value(datetime.datetime.now)
    'now'::text::timestamp

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
    NotImplementedError: sql_value() is not implemented for value {} of type dict


Database management
===================

``rex.deploy`` can generate SQL for creating, destroying and renaming databases::

    >>> from rex.deploy import sql_create_database, sql_drop_database, \
    ...                        sql_select_database, sql_rename_database

    >>> print sql_create_database(u'deploy_demo')
    CREATE DATABASE "deploy_demo" WITH ENCODING = 'UTF-8';
    >>> print sql_drop_database(u'deploy_demo')
    DROP DATABASE "deploy_demo";
    >>> print sql_select_database(u'deploy_demo')
    SELECT TRUE FROM pg_catalog.pg_database AS d WHERE d.datname = 'deploy_demo';

When creating a database, you can specify an existing database as a template::

    >>> print sql_create_database(u'deploy_demo', template=u'deploy_demo_template')
    CREATE DATABASE "deploy_demo" WITH ENCODING = 'UTF-8' TEMPLATE = "deploy_demo_template";

If a database exists, it can be renamed::

    >>> print sql_rename_database(u'deploy_demo', u'new_deploy_demo')
    ALTER DATABASE "deploy_demo" RENAME TO "new_deploy_demo";


Tables, columns, indexes, constraints, and sequences
====================================================

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

``rex.deploy`` can also generate ``ALTER TABLE`` statements to manage columns
and constraints::

    >>> from rex.deploy import sql_add_column, sql_drop_column, \
    ...                        sql_set_column_default, \
    ...                        sql_add_unique_constraint, \
    ...                        sql_add_foreign_key_constraint, \
    ...                        sql_drop_constraint

    >>> print sql_add_column(u'study', u'code', (u'varchar', 8), True)
    ALTER TABLE "study" ADD COLUMN "code" "varchar"(8) NOT NULL;
    >>> print sql_add_column(u'study', u'title', u'text', False)
    ALTER TABLE "study" ADD COLUMN "title" "text";
    >>> print sql_set_column_default(u'study', u'closed', sql_value(True))
    ALTER TABLE "study" ALTER COLUMN "closed" SET DEFAULT TRUE;
    >>> print sql_set_column_default(u'study', u'id', None)
    ALTER TABLE "study" ALTER COLUMN "id" DROP DEFAULT;
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

``rex.deploy`` can create and drop indexes::

    >>> from rex.deploy import sql_create_index, sql_drop_index

    >>> print sql_create_index(fk_name, u'study', [u'study_id'])
    CREATE INDEX "case_study_fk" ON "study" ("study_id");
    >>> print sql_drop_index(fk_name)
    DROP INDEX "case_study_fk";

``rex.deploy`` can be used to create and drop sequence objects::

    >>> from rex.deploy import sql_create_sequence, sql_drop_sequence

    >>> print sql_create_sequence(u"study_seq")
    CREATE SEQUENCE "study_seq";
    >>> print sql_create_sequence(u"individual_seq", u"individual", u"id")
    CREATE SEQUENCE "individual_seq" OWNED BY "individual"."id";
    >>> print sql_drop_sequence(u"measure_seq")
    DROP SEQUENCE "measure_seq";


Data types
==========

``rex.deploy`` can create and drop types::

    >>> from rex.deploy import sql_create_enum_type, sql_drop_type

    >>> enum_name = mangle([u'individual', u'sex'], u'enum')
    >>> print sql_create_enum_type(enum_name, [u'male', u'female', u'unknown'])
    CREATE TYPE "individual_sex_enum" AS ENUM ('male', 'female', 'unknown');

    >>> print sql_drop_type(enum_name)
    DROP TYPE "individual_sex_enum";


Stored procedures and triggers
==============================

``rex.deploy`` can create and drop functions and triggers::

    >>> from rex.deploy import sql_create_function, sql_drop_function, \
    ...                        sql_create_trigger, sql_drop_trigger

    >>> trigger_name = mangle(u'individual', u'pk')
    >>> print sql_create_function(trigger_name, (), u'trigger', u'plpgsql',
    ...                           u'\nBEGIN NEW."sex" := COALESCE(NEW."sex", \'unknown\'); END;\n')
    CREATE FUNCTION "individual_pk"() RETURNS "trigger" LANGUAGE plpgsql AS '
    BEGIN NEW."sex" := COALESCE(NEW."sex", ''unknown''); END;
    ';

    >>> print sql_create_trigger(u'individual', trigger_name, u'BEFORE', u'INSERT',
    ...                          trigger_name, ())
    CREATE TRIGGER "individual_pk" BEFORE INSERT ON "individual" FOR EACH ROW EXECUTE PROCEDURE "individual_pk"();

    >>> print sql_drop_trigger(u'individual', trigger_name)
    DROP TRIGGER "individual_pk" ON "individual";

    >>> print sql_drop_function(trigger_name, ())
    DROP FUNCTION "individual_pk"();


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


