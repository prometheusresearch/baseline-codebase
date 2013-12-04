**********************
  Deploying identity
**********************

.. contents:: Table of Contents


Parsing identity record
=======================

Start with creating a test database and a driver::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_identity')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

Identity fact is denoted by field ``identity``::

    >>> driver.parse("""{ identity: [individual.code] }""")
    IdentityFact(u'individual', [u'code'])

The identity should have at least one label::

    >>> driver.parse("""{ identity: [] }""")
    Traceback (most recent call last):
      ...
    Error: Got missing identity fields
    While parsing:
        "<byte string>", line 1

The table of the identity constraint could be set either as a prefix
of identity label or as a separate ``of`` field::

    >>> driver.parse("""{ identity: [code], of: individual }""")
    IdentityFact(u'individual', [u'code'])

It is an error of the table of the identity is not set or set
multiple times::

    >>> driver.parse("""{ identity: [code] }""")
    Traceback (most recent call last):
      ...
    Error: Got missing table name
    While parsing:
        "<byte string>", line 1

    >>> driver.parse("""{ identity: [individual.code], of: study }""")
    Traceback (most recent call last):
      ...
    Error: Got mismatched table names:
        individual, study
    While parsing:
        "<byte string>", line 1


Creating the identity
=====================

Deploying an identity fact creates a ``PRIMARY KEY`` constraint
on a table::

    >>> driver("""
    ... - { table: individual }
    ... - { column: individual.code, type: text }
    ... - { identity: [individual.code] }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "individual" ...
    ALTER TABLE "individual" ADD CONSTRAINT "individual_pk" PRIMARY KEY ("code");

    >>> schema = driver.get_schema()
    >>> individual_table = schema[u'individual']
    >>> individual_table.primary_key is not None
    True

Deploying the same fact again has no effect::

    >>> driver("""{ identity: [individual.code] }""")

Table identity may include both columns and links::

    >>> driver("""
    ... - { table: identity }
    ... - { link: identity.individual }
    ... - { column: identity.code, type: text }
    ... - { identity: [individual, code], of: identity }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "identity" ...
    ALTER TABLE "identity" ADD CONSTRAINT "identity_pk" PRIMARY KEY ("individual_id", "code");

It is an error if identity refers to an unknown table or a column::

    >>> driver("""{ identity: [measure.code] }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing table:
        measure
    While deploying:
        "<byte string>", line 1

    >>> driver("""{ identity: [individual.family, individual.code] }""")
    Traceback (most recent call last):
      ...
    Error: Detected missing column:
        individual.family
    While deploying:
        "<byte string>", line 1

If ``PRIMARY KEY`` already exists and is different from the given ``identity``,
the old ``PRIMARY KEY`` is deleted::

    >>> driver("""{ identity: [identity.individual] }""")
    ALTER TABLE "identity" DROP CONSTRAINT "identity_pk";
    ALTER TABLE "identity" ADD CONSTRAINT "identity_pk" PRIMARY KEY ("individual_id");

If the driver is locked and the primary key does not exist or does not
match the identity, an error is raised::

    >>> driver("""
    ... - { table: measure }
    ... - { column: measure.code, type: text }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "measure" ...

    >>> driver("""{ identity: [measure.code] }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected table with missing PRIMARY KEY constraint:
        measure
    While validating:
        "<byte string>", line 1

    >>> driver("""{ identity: [identity.code] }""",
    ...        is_locked=True)
    Traceback (most recent call last):
      ...
    Error: Detected table with mismatched PRIMARY KEY constraint:
        identity
    While validating:
        "<byte string>", line 1

Finally, we drop the test database::

    >>> driver.close()
    >>> cluster.drop()

