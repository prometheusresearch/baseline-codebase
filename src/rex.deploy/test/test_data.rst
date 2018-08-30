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

    >>> fact = driver.parse("""{ data: ./deploy/individual.csv }""")
    >>> fact
    DataFact(u'individual', data_path='./deploy/individual.csv')
    >>> print(fact)
    data: ./deploy/individual.csv
    of: individual

You could either specify the path to a data file or embed input data::

    >>> fact = driver.parse("""
    ... data: |
    ...   code,name
    ...   asdl,Autism Spectrum Disorder Lab
    ... of: study
    ... """)
    >>> fact
    DataFact(u'study', data='code,name\nasdl,Autism Spectrum Disorder Lab\n')
    >>> print(fact)
    data: |
      code,name
      asdl,Autism Spectrum Disorder Lab
    of: study

If the ``of`` field omitted, the table name is inferred from the file name.  If
you embed input data in ``data`` field, you must provide the table name via
``of`` field::

    >>> driver.parse("""
    ... data:
    ...   code: asdl
    ...   name: Autism Spectrum Disorder Lab
    ... """)
    Traceback (most recent call last):
      ...
    Error: Got missing table name
    While parsing data fact:
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
    ... - { column: sample.current, type: boolean }
    ... - { column: sample.other, type: json }
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
        WHERE "id" = 2
        RETURNING "id", "code", "notes";
    UPDATE "family"
        SET "notes" = 'Clarks'
        WHERE "id" = 3
        RETURNING "id", "code", "notes";

Note that empty values in CSV input are ignored.

It is an error if the data table does not exist or lacks identity::

    >>> driver("""{ data: measure.csv }""")
    Traceback (most recent call last):
      ...
    Error: Discovered missing table:
        measure
    While deploying data fact:
        "<byte string>", line 1

    >>> driver("""{ table: measure }""")                # doctest: +ELLIPSIS
    CREATE TABLE "measure" ...
    >>> driver("""{ data: measure.csv }""")
    Traceback (most recent call last):
      ...
    Error: Discovered table without identity:
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
    Error: Discovered missing value for identity field:
        code
    While parsing row #1:
        ,Dixons
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
    Error: Detected inconsistent data model:
        UPDATE "family"
            SET "notes" = 'Crawfords'
            WHERE "id" = 3
            RETURNING "id", "code", "notes";
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
    Error: Detected inconsistent data model:
        INSERT INTO "family" ("code", "notes")
            VALUES ('1004', 'Dixons')
            RETURNING "id", "code", "notes";
    While processing row #1:
        {'1004', 'Dixons'}
    While validating data fact:
        "<byte string>", line 2


Loading data
============

``rex.deploy`` can load input data from a CSV, JSON or YAML file::

    >>> from rex.core import SandboxPackage
    >>> sandbox = SandboxPackage()
    >>> driver.chdir(sandbox.static)

    >>> sandbox.rewrite('./deploy/family.csv', """\
    ... code,notes
    ... 1001,Andersons
    ... """)
    >>> driver("""{ data: ./deploy/family.csv }""")

    >>> sandbox.rewrite('./deploy/family.json', """\
    ... { "code": "1002", "notes": "Browns" }
    ... """)
    >>> driver("""{ data: ./deploy/family.json }""")

    >>> sandbox.rewrite('./deploy/family.yaml', """\
    ... code: '1003'
    ... notes: Clarks
    ... """)
    >>> driver("""{ data: ./deploy/family.yaml }""")

File format is determined from the file extension.  Unknown extensions are
reported::

    >>> driver("""{ data: ./deploy/family.xsl }""")     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Failed to recognize file format:
        /.../deploy/family.xsl
    While deploying data fact:
        "<byte string>", line 1

Ill-formed input data raises an exception::

    >>> sandbox.rewrite('./deploy/broken/family.json', """{]""")
    >>> driver("""{ data: ./deploy/broken/family.json }""") # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Discovered ill-formed JSON:
        Expecting property name: line 1 column 2 (char 1)
    While parsing JSON data:
        /.../deploy/broken/family.json
    While deploying data fact:
        "<byte string>", line 1

    >>> sandbox.rewrite('./deploy/broken/family.yaml', """{]""")
    >>> driver("""{ data: ./deploy/broken/family.yaml }""") # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Failed to parse a YAML document:
        while parsing a flow node
        did not find expected node content
          in "/.../deploy/broken/family.yaml", line 1, column 2
    While parsing YAML data:
        /.../deploy/broken/family.yaml
    While deploying data fact:
        "<byte string>", line 1


Column and link values
======================

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
    Error: Discovered missing record:
        individual[1001.01]
    While processing row #1:
        {'1001', '01', '1001.01', '1001.01'}
    While deploying data fact:
        "<byte string>", line 2

Values of different types are accepted::

    >>> driver("""
    ... data: |
    ...   individual,code,age,height,salary,birth,sleep,timestamp,current,other
    ...   1003.03,01,30,175.05,95000,1990-03-13,22:30,2010-12-03 20:37,false,{}
    ... of: sample
    ... """)
    SELECT "id", "individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp", "current", "other"
        FROM "sample";
    INSERT INTO "sample" ("individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp", "current", "other")
        VALUES (3, '01', 30, 175.05, 95000, '1990-03-13', '22:30:00', '2010-12-03 20:37:00', FALSE, '{}')
        RETURNING "id", "individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp", "current", "other";

Values could be specified in a structured format::

    >>> driver("""
    ... data:
    ...   individual: '1003.03'
    ...   code: '02'
    ...   age: 33
    ...   height: 175.05
    ...   salary: 130000
    ...   birth: 1990-03-13
    ...   sleep: '23:15'
    ...   timestamp: 2013-12-17 12:50:03
    ...   current: false
    ...   other: {}
    ... of: sample
    ... """)
    INSERT INTO "sample" ("individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp", "current", "other")
        VALUES (3, '02', 33, 175.05, 130000, '1990-03-13', '23:15:00', '2013-12-17 12:50:03', FALSE, '{}')
        RETURNING "id", "individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp", "current", "other";

You could also supply data directly from HTSQL query::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.deploy_demo')

    >>> from rex.db import get_db
    >>> with demo:
    ...     db = get_db()

    >>> data = db.produce("""
    ... /{[1003.03] :as individual, '03' :as code,
    ...   33 :as age, 175.05 :as height, 130000 :as salary,
    ...   date('1990-03-13') :as birth, time('23:45') :as sleep,
    ...   datetime('2013-12-19 13:22') :as timestamp, true :as current,
    ...   json('{}') :as other}
    ... """)
    >>> driver({ 'data': list(data), 'of': "sample" })
    INSERT INTO "sample" ("individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp", "current", "other")
        VALUES (3, '03', 33, 175.05, 130000, '1990-03-13', '23:45:00', '2013-12-19 13:22:00', TRUE, '{}')
        RETURNING "id", "individual_id", "code", "age", "height", "salary", "birth", "sleep", "timestamp", "current", "other";

Values of ``datetime`` type may contain a timezone, in which case, the value
is converted to the local timezone::

    >>> driver("""
    ... data:
    ...   individual: '1003.03'
    ...   code: '02'
    ...   timestamp: '2013-12-17 12:50:03-10'
    ... of: sample
    ... """)                                            # doctest: +ELLIPSIS
    UPDATE "sample"
        SET "timestamp" = '...'
        ...

Invalid values are rejected::

    >>> driver("""
    ... data: |
    ...   family,code,sex
    ...   1001,01,f
    ... of: individual
    ... """)
    Traceback (most recent call last):
      ...
    Error: Discovered invalid input:
        invalid enum literal: expected one of 'male', 'female'; got 'f'
    While converting field:
        sex
    While parsing row #1:
        1001,01,f
    While deploying data fact:
        "<byte string>", line 2

    >>> driver("""
    ... data:
    ...   individual: '1003.03'
    ...   code: 1990-03-13
    ... of: sample
    ... """)
    Traceback (most recent call last):
      ...
    Error: Discovered invalid input:
        datetime.date(1990, 3, 13)
    While converting field:
        code
    While parsing row #1:
        {u'code': datetime.date(1990, 3, 13), u'individual': '1003.03'}
    While deploying data fact:
        "<byte string>", line 2

    >>> driver("""
    ... data:
    ...   individual: '1003.03'
    ...   code: '02'
    ...   other: 1990-03-13
    ... of: sample
    ... """)
    Traceback (most recent call last):
      ...
    Error: Discovered invalid JSON input:
        datetime.date(1990, 3, 13) is not JSON serializable
    While converting field:
        other
    While parsing row #1:
        {u'code': '02', u'individual': '1003.03', u'other': datetime.date(1990, 3, 13)}
    While deploying data fact:
        "<byte string>", line 2


Removing data
=============

To remove data from a table, use ``data`` fact with unset ``present`` field::

    >>> driver("""
    ... data: |
    ...   code
    ...   1003
    ... of: family
    ... present: false
    ... """)
    DELETE FROM "family"
        WHERE "id" = 3;

Applying the same fact again has no effect::

    >>> driver("""
    ... data: |
    ...   code
    ...   1003
    ... of: family
    ... present: false
    ... """)

It is an error to specify non-identity fields when removing data::

    >>> driver("""
    ... data: |
    ...   code,notes
    ...   1003,Clarks
    ... of: family
    ... present: false
    ... """)
    Traceback (most recent call last):
      ...
    Error: Discovered unexpected field:
        notes
    While parsing row #1:
        1003,Clarks
    While deploying data fact:
        "<byte string>", line 2


Processing input data
=====================

Empty input is accepted::

    >>> driver("""{ data: "", of: family }""")
    >>> driver("""{ data: "code,notes\n", of: family }""")

Unknown and duplicate columns are detected::

    >>> driver("""
    ... data: |
    ...   code,name
    ...   1001,Johnsons
    ... of: family
    ... """)
    Traceback (most recent call last):
      ...
    Error: Discovered missing field:
        name
    While parsing row #1:
        1001,Johnsons
    While deploying data fact:
        "<byte string>", line 2

    >>> driver("""
    ... data: |
    ...   code,code
    ...   1001,2002
    ... of: family
    ... """)
    Traceback (most recent call last):
      ...
    Error: Discovered duplicate field:
        code
    While parsing row #1:
        1001,2002
    While deploying data fact:
        "<byte string>", line 2

All columns from the ``PRIMARY KEY`` must be included::

    >>> driver("""
    ... data: |
    ...   code,sex,father,mother
    ...   01,f,,
    ... of: individual
    ... """)
    Traceback (most recent call last):
      ...
    Error: Discovered missing value for identity field:
        family
    While parsing row #1:
        01,f,,
    While deploying data fact:
        "<byte string>", line 2

Each CSV row must have correct number of entries::

    >>> driver("""
    ... data: |
    ...   code
    ...   1001,Andersons
    ... of: family
    ... """)
    Traceback (most recent call last):
      ...
    Error: Discovered too many entries:
        2 > 1
    While parsing row #1:
        1001,Andersons
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
    Error: Discovered too few entries:
        2 < 3
    While parsing row #1:
        1001,01
    While deploying data fact:
        "<byte string>", line 2

Finally we destroy the test database::

    >>> driver.close()
    >>> cluster.drop()



