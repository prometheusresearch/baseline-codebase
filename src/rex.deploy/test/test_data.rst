******************
  Deploying data
******************

.. contents:: Table of Contents


Parsing data record
===================

Start with creating a test database and a driver::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_data')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

Field ``data`` denotes a data fact::

    >>> driver.parse("""{ data: ./deploy/individual.csv }""")
    DataFact(u'individual', data_path='./deploy/individual.csv')

You could specify either a path to a CSV file or embed CSV data
directly::

    >>> driver.parse("""
    ... data: |
    ...   code,name
    ...   asdl,Autism Spectrum Disorder Lab
    ... of: study
    ... """)
    DataFact(u'study', data='code,name\nasdl,Autism Spectrum Disorder Lab\n')

If the ``of`` field omitted, the table name is inferred from
the file name.  If you embed CSV data in ``data`` field, you
must provide the table name via ``of`` field::

    >>> driver.parse("""
    ... data: |
    ...   code,name
    ...   asdl,Autism Spectrum Disorder Lab
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got missing table name
    While parsing:
        "<byte string>", line 2


Adding rows
===========

We create tables with columns and links::

    >>> driver("""
    ... - { table: family }
    ... - { column: family.code, type: text }
    ... - { identity: [family.code] }
    ... - { column: family.notes, type: text, required: false }
    ... - { table: individual }
    ... - { link: individual.family }
    ... - { column: individual.code, type: text }
    ... - { identity: [individual.family, individual.code] }
    ... - { column: individual.sex, type: [male, female], required: false }
    ... - { link: individual.mother, to: individual, required: false }
    ... - { link: individual.father, to: individual, required: false }
    ... - { table: sample }
    ... - { link: sample.individual }
    ... - { column: sample.code, type: text }
    ... - { identity: [sample.individual, sample.code] }
    ... - { column: sample.age, type: integer }
    ... - { column: sample.height, type: float }
    ... - { column: sample.salary, type: decimal }
    ... - { column: sample.birth, type: date }
    ... - { column: sample.sleep, type: time }
    ... - { column: sample.timestamp, type: datetime }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "family" ...
    CREATE TABLE "individual" ...
    CREATE TABLE "sample" ...

Deploying a data fact adds rows to a table::

    >>> driver("""
    ... data: |
    ...   code,notes
    ...   1001,Andersons
    ...   1002,Bergmans
    ...   1003,
    ... of: family
    ... """)
    SELECT "id", "code", "notes"
        FROM "family";
    INSERT INTO "family" ("code", "notes")
        VALUES ('1001', 'Andersons')
        RETURNING "id", "code", "notes";
    INSERT INTO "family" ("code", "notes")
        VALUES ('1002', 'Bergmans')
        RETURNING "id", "code", "notes";
    INSERT INTO "family" ("code")
        VALUES ('1003')
        RETURNING "id", "code", "notes";

Deploying the same fact second time has no effect::

    >>> driver("""
    ... data: |
    ...   code,notes
    ...   1001,Andersons
    ...   1002,Bergmans
    ...   1003,
    ... of: family
    ... """)

However if data is changed, the respective table record is updated::

    >>> driver("""
    ... data: |
    ...   code,notes
    ...   1001,
    ...   1002,Browns
    ...   1003,Clarks
    ... of: family
    ... """)
    UPDATE "family"
        SET "notes" = 'Browns'
        WHERE "code" = '1002'
        RETURNING "id", "code", "notes";
    UPDATE "family"
        SET "notes" = 'Clarks'
        WHERE "code" = '1003'
        RETURNING "id", "code", "notes";

Note that empty values are ignored here.

It is an error if the data table does not exist or lacks identity::

    >>> driver("""{ data: measure.csv }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing table:
        measure
    While deploying data fact:
        "<byte string>", line 1

    >>> driver("""{ table: measure }""")                # doctest: +ELLIPSIS
    CREATE TABLE "measure" ...
    >>> driver("""{ data: measure.csv }""")
    Traceback (most recent call last):
      ...
    Error: Detected table without PRIMARY KEY constraint:
        measure
    While deploying data fact:
        "<byte string>", line 1

A row must contain the value of the ``PRIMARY KEY``::

    >>> driver("""
    ... data: |
    ...   code,notes
    ...   ,Dixons
    ... of: family
    ... """)
    Traceback (most recent call last):
      ...
    Error: Detected column with missing value:
        code
    While processing row #1:
        {'Dixons'}
    While deploying data fact:
        "<byte string>", line 2

If the driver is locked, it cannot modify existing or add new records::

    >>> driver("""
    ... data: |
    ...   code,notes
    ...   1003,Crawfords
    ... of: family
    ... """, is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected modified row
    While processing row #1:
        {'1003', 'Crawfords'}
    While validating data fact:
        "<byte string>", line 2

    >>> driver("""
    ... data: |
    ...   code,notes
    ...   1004,Dixons
    ... of: family
    ... """, is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected missing row
    While processing row #1:
        {'1004', 'Dixons'}
    While validating data fact:
        "<byte string>", line 2


Links and data types
====================

Links are resolved to ``id`` values::

    >>> driver("""
    ... data: |
    ...   family,code,sex,mother,father
    ...   1003,01,female,,
    ...   1003,02,male,,
    ...   1003,03,,1003.01,1003.02
    ... of: individual
    ... """)
    SELECT "id", "family_id", "code", "sex", "mother_id", "father_id"
        FROM "individual";
    INSERT INTO "individual" ("family_id", "code", "sex")
        VALUES (3, '01', 'female')
        RETURNING "id", "family_id", "code", "sex", "mother_id", "father_id";
    INSERT INTO "individual" ("family_id", "code", "sex")
        VALUES (3, '02', 'male')
        RETURNING "id", "family_id", "code", "sex", "mother_id", "father_id";
    INSERT INTO "individual" ("family_id", "code", "mother_id", "father_id")
        VALUES (3, '03', 1, 2)
        RETURNING "id", "family_id", "code", "sex", "mother_id", "father_id";

Invalid links are rejected::

    >>> driver("""
    ... data: |
    ...   family,code,sex,mother,father
    ...   1001,01,,1001.01,1001.01
    ... of: individual
    ... """)
    Traceback (most recent call last):
      ...
    Error: Detected unknown link:
        1001.01
    While processing row #1:
        {'1001', '01', '1001.01', '1001.01'}
    While deploying data fact:
        "<byte string>", line 2

Values of different types are accepted::

    >>> driver("""
    ... data: |
    ...   individual,code,age,height,salary,birth,sleep,timestamp
    ...   1003.03,01,30,175.05,95000,1990-03-13,22:30,2013-12-03 20:37
    ... of: sample
    ... """)
    SELECT "id", "individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp"
        FROM "sample";
    INSERT INTO "sample" ("individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp")
        VALUES (3, '01', 30, 175.05, 95000, '1990-03-13', '22:30:00', '2013-12-03 20:37:00')
        RETURNING "id", "individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp";


Parsing CSV
===========

Empty data is accepted::

    >>> driver("""{ data: "", of: family }""")

Unknown and duplicate columns are detected::

    >>> driver("""{ data: "code,name\\n", of: family }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing column:
        name
    While deploying data fact:
        "<byte string>", line 1

    >>> driver("""{ data: "code,code\\n", of: family }""")
    Traceback (most recent call last):
      ...
    Error: Detected duplicate column:
        code
    While deploying data fact:
        "<byte string>", line 1

All columns from the ``PRIMARY KEY`` must be included::

    >>> driver("""{ data: "code,sex,father,mother\\n", of: individual }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing PRIMARY KEY column:
        family_id
    While deploying data fact:
        "<byte string>", line 1

Each CSV row must have correct number of entries::

    >>> driver("""
    ... data: |
    ...   code
    ...   1001,Andersons
    ... of: family
    ... """)
    Traceback (most recent call last):
      ...
    Error: Detected too many entries:
        2 > 1
    On:
        row 2
    While deploying data fact:
        "<byte string>", line 2

    >>> driver("""
    ... data: |
    ...   family,code,sex
    ...   1001,01
    ... of: individual
    ... """)
    Traceback (most recent call last):
      ...
    Error: Detected too few entries:
        2 < 3
    On:
        row 2
    While deploying data fact:
        "<byte string>", line 2

Invalid values are rejected::

    >>> driver("""
    ... data: |
    ...   family,code,sex
    ...   1001,01,f
    ... of: individual
    ... """)
    Traceback (most recent call last):
      ...
    Error: Detected invalid input:
        invalid enum literal: expected one of 'male', 'female'; got 'f'
    While converting column:
        sex
    On:
        row 2
    While deploying data fact:
        "<byte string>", line 2

Finally we destroy the test database::

    >>> driver.close()
    >>> cluster.drop()


