*************************
  Working with Entities
*************************

.. contents:: Table of Contents


Creating tables
===============

We start with creating a schema object that encapsulates operations
on a database schema::

    >>> from rex.deploy import Cluster, model
    >>> cluster = Cluster('pgsql:deploy_demo_model')
    >>> cluster.overwrite()
    >>> driver = cluster.drive()

    >>> schema = model(driver)

We can use a schema object to create new tables::

    >>> individual_table = schema.build_table(label=u"individual")
    >>> measure_table = schema.build_table(label=u"measure")

Then we can list all tables in the schema::

    >>> for table in schema.tables():
    ...     print table
    table: individual
    table: measure

We can also find a table by name::

    >>> print schema.table(u"individual")
    table: individual

Finally, we can generate a list of fact objects that could be used to
recreate the schema::

    >>> schema.facts()          # doctest: +NORMALIZE_WHITESPACE
    [TableFact(u'individual'),
     TableFact(u'measure'),
     TableFact(u'individual', related=[]),
     TableFact(u'measure', related=[])]

Displaying a schema object prints these facts in YAML format::

    >>> print schema
    - table: individual
    - table: measure
    - table: individual
    - table: measure


Working with tables
===================

A table object allows you to create columns, links and table identity::

    >>> code_column = individual_table.build_column(label=u"code", type="text")
    >>> print code_column
    column: code
    of: individual
    type: text

    >>> mother_link = individual_table.build_link(
    ...     label=u"mother", target_table=individual_table, is_required=False)
    >>> print mother_link
    link: mother
    of: individual
    to: individual
    required: false

    >>> sex_column = individual_table.build_column(
    ...     label=u"sex", type=[u"male", u"female"], is_required=False)
    >>> print sex_column
    column: sex
    of: individual
    type: [male, female]
    required: false

    >>> individual_identity = individual_table.build_identity(fields=[code_column])
    >>> print individual_identity
    identity: [code]
    of: individual

    >>> print schema
    - table: individual
    - table: measure
    - table: individual
      with:
      - column: code
        type: text
      - link: mother
        to: individual
        required: false
      - column: sex
        type: [male, female]
        required: false
      - identity: [code]
    - table: measure

You can now list all fields, or find a field by name, or get the identity
object::

    >>> for field in individual_table.fields():
    ...     print field
    column: code
    of: individual
    type: text
    link: mother
    of: individual
    to: individual
    required: false
    column: sex
    of: individual
    type: [male, female]
    required: false

    >>> print individual_table.column('code')
    column: code
    of: individual
    type: text

    >>> print individual_table.link('mother')
    link: mother
    of: individual
    to: individual
    required: false

    >>> print individual_table.identity()
    identity: [code]
    of: individual

It is also possible to modify or delete table fields or a table itself::

    >>> mother_link.modify(label=u"father")

    >>> sex_column.erase()

    >>> measure_table.erase()

    >>> print schema
    - table: individual
    - table: individual
      with:
      - column: code
        type: text
      - link: father
        to: individual
        required: false
      - identity: [code]

Finally, we drop the test database::

    >>> driver.close()
    >>> cluster.drop()


