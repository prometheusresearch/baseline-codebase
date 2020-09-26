*******************
  Deploying views
*******************

.. contents:: Table of Contents

Parsing view record
===================

We start with creating a test database and a ``Driver`` instance::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_view')
    >>> cluster.overwrite()
    >>> driver = cluster.drive(logging=True)

Field ``view`` denotes a table fact::

    >>> fact = driver.parse("""{ view: one, definition: "select 1 as n" }""")

    >>> fact
    ViewFact('one', definition='select 1 as n')
    >>> print(fact)
    view: one
    definition: select 1 as n

Creating the view
=================

Deploying a view fact creates the view::

    >>> driver("""{ view: one, definition: "select 1 as n" }""")
    CREATE VIEW "one" AS (select 1 as n);

    >>> schema = driver.get_schema()
    >>> 'one' in schema
    True

Deploying the same fact second time has no effect::

    >>> driver("""{ view: one, definition: "select 1 as n" }""")

Renaming the view
=================

Deploying a view fact with ``was`` and another name will rename the view::

    >>> driver("""{ view: one2, was: one}""")
    ALTER VIEW "one" RENAME TO "one2";

Altering view definition
========================

Deploying a view fact with another definition will re-create the view::

    >>> driver("""{ view: one2, definition: "select 2 as n" }""")
    DROP VIEW "one2";
    CREATE VIEW "one2" AS (select 2 as n);

Deploying the same fact second time has no effect::

    >>> driver("""{ view: one2, definition: "select 2 as n" }""")

Dropping the view
=================

You can use ``ViewFact`` to remove a view::

    >>> driver("""{ view: one2, present: false }""")
    DROP VIEW "one2";

Deploying the same fact second time has no effect::

    >>> driver("""{ view: one2, present: false }""")

Views which depend on one another
=================================

Let's create another view which uses the original ``one`` view in its
definition::

    >>> driver("""
    ... - view: one
    ...   definition: select 1 as n
    ... - view: one_plus
    ...   definition: select n + 1 from one
    ... """)
    CREATE VIEW "one" AS (select 1 as n);
    CREATE VIEW "one_plus" AS (select n + 1 from one);

Now we can try altering the ``one`` view which has dependents::

    >>> driver("""{ view: one, definition: "select 2 as n" }""") # doctest: +ELLIPSIS
    ...
    Traceback (most recent call last):
    ...
    rex.core.Error: Got an error from the database driver:
        cannot drop view one because other objects depend on it
        DETAIL:  view one_plus depends on view one
        HINT:  Use DROP ... CASCADE to drop the dependent objects too.
    While executing SQL:
        DROP VIEW "one";
    While deploying view fact:
        "<unicode string>", line 1
