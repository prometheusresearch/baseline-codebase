*********************
  Deploying raw SQL
*********************

.. contents:: Table of Contents


Parsing raw record
==================

Start with creating a test database and a driver::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_raw')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

Field ``sql`` denotes a raw SQL fact::

    >>> fact = driver.parse("""{ sql: ./deploy/study_history.sql, unless: ./deploy/study_history_check.sql }""")
    >>> fact
    RawFact(action_sql_path='./deploy/study_history.sql', check_sql_path='./deploy/study_history_check.sql')
    >>> print(fact)
    sql: ./deploy/study_history.sql
    unless: ./deploy/study_history_check.sql

You could either specify the path to a SQL file or embed SQL directly::

    >>> fact = driver.parse("""
    ... sql: |
    ...   CREATE INDEX study_title_idx ON study USING gin(to_tsvector('english', title));
    ... unless: |
    ...   SELECT TRUE FROM pg_catalog.pg_class WHERE relname = 'study_title_idx';
    ... """)
    >>> fact            # doctest: +NORMALIZE_WHITESPACE
    RawFact(action_sql="CREATE INDEX study_title_idx ON study USING gin(to_tsvector('english', title));\n",
            check_sql="SELECT TRUE FROM pg_catalog.pg_class WHERE relname = 'study_title_idx';\n")
    >>> print(fact)
    sql: |
      CREATE INDEX study_title_idx ON study USING gin(to_tsvector('english', title));
    unless: |
      SELECT TRUE FROM pg_catalog.pg_class WHERE relname = 'study_title_idx';


Executing SQL
=============

We create a table with some columns::

    >>> driver("""
    ... - { table: study }
    ... - { column: study.code, type: text }
    ... - { identity: [study.code] }
    ... - { column: study.title, type: text }
    ... - { column: study.description, type: text }
    ... """)                # doctest: +ELLIPSIS
    CREATE TABLE "study" ...

We would like to install a full-text search index on the ``study.title`` column::

    >>> driver("""
    ... sql:
    ...   CREATE INDEX study_title_idx ON study USING gin(to_tsvector('english', title));
    ... unless:
    ...   SELECT TRUE FROM pg_catalog.pg_class WHERE relname = 'study_title_idx';
    ... """)
    SELECT TRUE FROM pg_catalog.pg_class WHERE relname = 'study_title_idx';
    CREATE INDEX study_title_idx ON study USING gin(to_tsvector('english', title));

Note that the second time we run the same fact, the ``CREATE INDEX`` statement
will not be executed::

    >>> driver("""
    ... sql:
    ...   CREATE INDEX study_title_idx ON study USING gin(to_tsvector('english', title));
    ... unless:
    ...   SELECT TRUE FROM pg_catalog.pg_class WHERE relname = 'study_title_idx';
    ... """)
    SELECT TRUE FROM pg_catalog.pg_class WHERE relname = 'study_title_idx';

In the locked mode, the fact fails unless the postcondition is satisfied::

    >>> driver("""
    ... sql:
    ...   CREATE INDEX study_description_idx ON study USING gin(to_tsvector('english', description));
    ... unless:
    ...   SELECT TRUE FROM pg_catalog.pg_class WHERE relname = 'study_description_idx';
    ... """,
    ... is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Discovered failed assertion:
        SELECT TRUE FROM pg_catalog.pg_class WHERE relname = 'study_description_idx';
    While validating sql fact:
        "<byte string>", line 2

Finally we destroy the test database::

    >>> driver.close()
    >>> cluster.drop()



