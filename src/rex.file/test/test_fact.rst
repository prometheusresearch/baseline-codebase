*************
  File Fact
*************

.. contents:: Table of Contents


Parsing file record
===================

Start with creating a test database, a driver and an application::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:file_demo_fact')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

    >>> from rex.core import LatentRex
    >>> demo = LatentRex('rex.file_demo', db='pgsql:file_demo_fact')
    >>> demo.on()

We use ``file`` field to denote an attachment field::

    >>> driver.parse("""{ file: consent.consent_form_scan }""")
    FileFact('consent', 'consent_form_scan')

The table name could also be specified using ``of`` field::

    >>> driver.parse("""{ file: consent_form_scan, of: consent }""")
    FileFact('consent', 'consent_form_scan')

The table name must be specified once and only once::

    >>> driver.parse("""{ file: consent_form_scan }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got missing table name
    While parsing file fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ file: consent.consent_form_scan, of: individual }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got mismatched table names:
        consent, individual
    While parsing file fact:
        "<unicode string>", line 1

You can indicate any old names of the file using ``was`` clause::

    >>> driver.parse("""{ file: consent.file, was: consent_form_scan }""")
    FileFact('consent', 'file', former_labels=['consent_form_scan'])

Turn off ``required`` flag to make the field optional::

    >>> driver.parse("""{ file: consent.consent_form_scan, required: false }""")
    FileFact('consent', 'consent_form_scan', is_required=False)

You can specify the field title::

    >>> driver.parse("""{ file: consent.consent_form_scan, title: Scan of the consent form }""")
    FileFact('consent', 'consent_form_scan', title='Scan of the consent form')

Turn off the ``present`` flag to remove the field::

    >>> driver.parse("""{ file: consent.consent_form_scan, present: false }""")
    FileFact('consent', 'consent_form_scan', is_present=False)

When ``present`` is off, other properties cannot be specified::

    >>> driver.parse("""{ file: consent.consent_form_scan, present: false, required: false }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unexpected clause:
        required
    While parsing file fact:
        "<unicode string>", line 1


Using a file field
==================

Deploying a file fact creates a ``file`` table and a link to it::

    >>> driver("""
    ... - { table: scan }
    ... - { column: scan.code, type: text }
    ... - { identity: [scan.code] }
    ... - { file: scan.file }
    ... """)                                                # doctest: +ELLIPSIS
    CREATE TABLE "scan" ...
    CREATE TABLE "file" ...
    ...
    CREATE OR REPLACE FUNCTION "file_chk"() RETURNS "trigger" LANGUAGE plpgsql AS ...;
    CREATE TRIGGER "file_chk" BEFORE INSERT OR UPDATE ON "file" FOR EACH ROW EXECUTE PROCEDURE "file_chk"();
    COMMENT ON TRIGGER "file_chk" ON "file" IS '---
    file: ''-''
    ';
    ALTER TABLE "scan" ADD COLUMN "file_id" "int4" NOT NULL;
    ALTER TABLE "scan" ADD CONSTRAINT "scan_file_fk" FOREIGN KEY ("file_id") REFERENCES "file" ("id") ON DELETE SET DEFAULT;
    CREATE INDEX "scan_file_fk" ON "scan" ("file_id");
    CREATE OR REPLACE FUNCTION "scan_file_file_chk"() RETURNS "trigger" LANGUAGE plpgsql AS ...;
    CREATE TRIGGER "scan_file_file_chk" BEFORE INSERT OR UPDATE ON "scan" FOR EACH ROW EXECUTE PROCEDURE "scan_file_file_chk"();
    COMMENT ON TRIGGER "scan_file_file_chk" ON "scan" IS '---
    file: file
    ';

Notably you cannot rename the file table::

    >>> driver("""{ table: attachment, was: file }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Cannot rename table:
        file
    While deploying table fact:
        "<unicode string>", line 1

However you can remove the file table, which will also remove the file field::

    >>> driver("""{ table: file, present: false }""")
    ALTER TABLE "scan" DROP COLUMN "file_id";
    DROP TRIGGER "scan_file_file_chk" ON "scan";
    DROP FUNCTION "scan_file_file_chk"();
    DROP TABLE "file";
    DROP FUNCTION "file_chk"();

We can add the file field back, which will add the file table back::

    >>> driver("""{ file: scan.file }""")           # doctest: +ELLIPSIS
    CREATE TABLE "file" ...
    ALTER TABLE "scan" ADD COLUMN "file_id" ...

When the parent table is renamed, the constraint is renamed too::

    >>> driver("""{ table: image, was: scan }""")   # doctest: +ELLIPSIS
    ALTER TABLE "scan" RENAME TO "image";
    ...
    ALTER TRIGGER "scan_file_file_chk" ON "image" RENAME TO "image_file_file_chk";
    ALTER FUNCTION "scan_file_file_chk"() RENAME TO "image_file_file_chk";
    CREATE OR REPLACE FUNCTION "image_file_file_chk"() RETURNS "trigger" LANGUAGE plpgsql AS ...;

Removing the file field will removing the link::

    >>> driver("""{ file: image.file, present: false }""")
    ALTER TABLE "image" DROP COLUMN "file_id";
    DROP TRIGGER "image_file_file_chk" ON "image";
    DROP FUNCTION "image_file_file_chk"();

Finally, we drop the test database::

    >>> driver.close()
    >>> cluster.drop()


