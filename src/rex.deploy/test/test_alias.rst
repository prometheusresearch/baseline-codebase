*******************************
  Deploying calculated fields
*******************************

.. contents:: Table of Contents


Parsing alias record
====================

Start with creating a test database and a driver::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_alias')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

We declare calculated fields with ``alias`` records::

    >>> fact = driver.parse("""{ alias: "family.size := count(individual)" }""")
    >>> fact
    AliasFact('family', 'size', body='count(individual)')
    >>> print(fact)
    alias: size
    of: family
    expression: count(individual)

This creates a calculated field ``size`` on the ``family`` table.  You can also
specify the table name via ``of`` attribute::

    >>> driver.parse("""{ alias: "size := count(individual)", of: family }""")
    AliasFact('family', 'size', body='count(individual)')

Similarly, the body of the calculated field could be provided separately::

    >>> driver.parse("""{ alias: family.size, expression: count(individual) }""")
    AliasFact('family', 'size', body='count(individual)')

A calculated field may require parameters, which can be specified as follows::

    >>> fact = driver.parse("""
    ... { alias: "family.individual_by_sex($sex) := individual?sex=$sex" }
    ... """)
    >>> fact
    AliasFact('family', 'individual_by_sex', ['sex'], body='individual?sex=$sex')
    >>> print(fact)
    alias: individual_by_sex
    of: family
    parameters: [sex]
    expression: individual?sex=$sex

Again, parameters, can be listed separately::

    >>> driver.parse("""
    ... { alias: individual_by_sex, of: family, parameters: [sex], expression: "individual?sex=$sex" }
    ... """)
    AliasFact('family', 'individual_by_sex', ['sex'], body='individual?sex=$sex')

It is also possible to list parameters by the alias name, but keep body of the
expression separate::

    >>> driver.parse("""
    ... { alias: individual_by_sex($sex), of: family, expression: "individual?sex=$sex" }
    ... """)
    AliasFact('family', 'individual_by_sex', ['sex'], body='individual?sex=$sex')

Finally, you can also indicate that a particular calculated field does not
exist::

    >>> driver.parse("""{ alias: family.size, present: false }""")
    AliasFact('family', 'size', is_present=False)

It is an error if the table name is not specified or specified twice::

    >>> driver.parse("""{ alias: "size := count(individual)" }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got missing table name
    While parsing alias fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ alias: "family.size := count(individual)", of: study }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got mismatched table names:
        family, study
    While parsing alias fact:
        "<unicode string>", line 1

It is also an error to specify parameters twice::

    >>> driver.parse("""
    ... { alias: individual_by_sex($s), of: family, parameters: [sex], expression: "individual?sex=$sex" }
    ... """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Got mismatched table parameters:
        ['s'], ['sex']
    While parsing alias fact:
        "<unicode string>", line 2

The expression body should be specified just once, or, when parameter
``present`` is unset, should not be specified::

    >>> driver.parse("""{ alias: family, of: size }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got missing clause:
        expression
    While parsing alias fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ alias: "family.size := count(individual)", expression: count(individual) }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got mismatched alias expression:
        count(individual), count(individual)
    While parsing alias fact:
        "<unicode string>", line 1

    >>> driver.parse("""{ alias: family.size, expression: count(individual), present: false }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unexpected clause:
        expression
    While parsing alias fact:
        "<unicode string>", line 1


Using aliases
=============

Before we can define an alias, we need to create a basic database schema::

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
    ... - { column: individual.dob, type: date, required: false }
    ... - { link: individual.mother, to: individual, required: false }
    ... - { link: individual.father, to: individual, required: false }
    ... """)                                            # doctest: +ELLIPSIS
    CREATE TABLE "family" ...
    CREATE TABLE "individual" ...

We also populate it with some data::

    >>> driver("""
    ... - data: |
    ...     code,notes
    ...     1001,Andersons
    ...     1002,Bergmans
    ...   of: family
    ... - data: |
    ...     family,code,sex,dob,mother,father
    ...     1001,01,female,1980-12-04,,
    ...     1001,02,male,1977-04-17,,
    ...     1001,03,,,1001.01,1001.02
    ...     1002,01,female,1980-12-04,,
    ...     1002,02,female,2005-11-15,1001.01,
    ...     1002,03,female,2011-07-07,1001.01,
    ...   of: individual
    ... """)                                            # doctest: +ELLIPSIS
    SELECT "id", "code", "notes"
        FROM "family";
    ...
    SELECT "id", "family_id", "code", "sex", "dob", "mother_id", "father_id"
        FROM "individual";
    ...

Now, let us define a calculated field on the ``family`` table::

    >>> driver("""{ alias: "family.size := count(individual)" }""")
    COMMENT ON TABLE "family" IS '---
    aliases:
    - size := count(individual)
    ';

We can now use it::

    >>> db = driver.get_htsql()
    >>> db.produce("/family{id(),notes,size}")
    <Product ({[1001], 'Andersons', 3}, {[1002], 'Bergmans', 3})>

We can also define calculated fields with parameters, for example::

    >>> driver("""{ alias: "family.individual_by_sex($sex) := individual?sex=$sex" }""")
    COMMENT ON TABLE "family" IS '---
    aliases:
    - individual_by_sex($sex) := individual?sex=$sex
    - size := count(individual)
    ';

We have to acquire a fresh HTSQL instance before we can use it::

    >>> db = driver.get_htsql()
    >>> db.produce("/family{id(), /individual_by_sex('male')}")
    <Product ({[1001], ({[1001], '02', 'male', '1977-04-17', null, null},)}, {[1002], ()})>

By default, ``rex.deploy`` does not validate if the calculated field is valid::

    >>> driver("""{ alias: "family.individual_by_sex($sex) := individual?sex=$sexx" }""")
    COMMENT ON TABLE "family" IS '---
    aliases:
    - individual_by_sex($sex) := individual?sex=$sexx
    - size := count(individual)
    ';

However, when the driver is in validation mode, calculated fields are
validated::

    >>> driver.lock()

    >>> driver("""{ alias: "family.individual_by_sex($sex) := individual?sex=$sexx" }""")
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to compile HTSQL expression:
        Found unknown reference:
            $sexx
        Perhaps you had in mind:
            $sex
        While translating:
            family.individual_by_sex($sex) := individual?sex=$sexx
                                                             ^^^^^
    While validating alias fact:
        "<unicode string>", line 1

    >>> driver.unlock()

To remove an alias, we set parameter ``present`` to ``false``::

    >>> driver("""{ alias: family.individual_by_sex($sex), present: false }""")
    COMMENT ON TABLE "family" IS '---
    aliases:
    - size := count(individual)
    ';

Finally, we drop the test database::

    >>> driver.close()
    >>> cluster.drop()



