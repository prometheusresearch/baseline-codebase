*********************************
  REX.GRAPHQL Programming Guide
*********************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: meth(literal)
.. role:: func(literal)

Overview
========

``rex.graphql`` package allows to define GraphQL API endpoints which can query
relation databases or just compute data on-demand.

Basic usage in 3 steps
======================

There are three steps to start using ``rex.graphql``:

1. Define types which describe your data
2. Create schema and validate it against database
3. Execute queries against schema

1. Define types
---------------

``Object`` type constructor is the main building block for data which is
computed on-demand.

Each object type must have a name and a set of corresponding fields. Each field
is defined as a computation via ``compute`` function.

Example::

   >>> from rex.graphql import Object, List, scalar, compute

   >>> settings = Object(
   ...   name="settings",
   ...   fields=lambda: {
   ...      'app_title': compute(type=scalar.String)
   ...   }
   ... )

For data which comes from a database there's an ``Entity`` type constructor
which is similar to the ``Object`` type constructor but its fields must be
queries defined via ``query`` function.

Fields defined with ``query`` accept queries constructed programmatically via
query combinators API which are compiled into relational database queries. See
:ref:`guide-query-combinators` guide on how to use the API.

In case query results in another entity you must supply ``type`` argument,
otherwise it's going to be inferred automatically from a database schema.

Example::

   >>> from rex.graphql import Entity, query, q

   >>> region = Entity(
   ...   name="region",
   ...   fields=lambda: {
   ...      'name': query(q.name),
   ...      'nation_count': query(q.nation.count()),
   ...      'nation': query(q.nation, type=nation),
   ...   }
   ... )

   >>> nation = Entity(
   ...   name="nation",
   ...   fields=lambda: {
   ...      'name': query(q.name),
   ...      'nation': query(q.region, type=region),
   ...   }
   ... )

Note that with both ``Object`` and ``Entity`` we use ``lambda: ...`` when
defining their ``fields`` - that allows us to define mutually-recursive types:
``nation`` has ``region`` field of type ``region`` and ``region`` has ``nation``
field of type ``nation`` in the example above.

See :ref:`guide-db-queries` for a more detailed guide on how to query relation
database with GraphQL.

2. Create schema
----------------

Now that we have our types defined we need to create a GraphQL schema.

Schema can only be created with an active Rex application as it uses it to
validate types against database schema::

   >>> from rex.core import Rex
   >>> rex = Rex('rex.graphql_demo')
   >>> rex.on()

Now we create our schema by supplying fields for the root query::

   >>> from rex.graphql import schema

   >>> import collections
   >>> app_settings = collections.namedtuple('settings', ['app_title'])

   >>> def get_settings(parent, info, args):
   ...     return app_settings(app_title="GraphQL APP")

   >>> sch = schema(fields=lambda: {
   ...   'nation': query(q.nation, type=nation),
   ...   'region': query(q.region, type=region),
   ...   'settings': compute(f=get_settings, type=settings),
   ... })

3. Execute queries
------------------

Finally we can execute queries against schema using ``execute`` function::

   >>> from rex.graphql import execute

   >>> res = execute(sch, """
   ...   query {
   ...     region {
   ...       name
   ...       nation_count
   ...     }
   ...     settings {
   ...       app_title
   ...     }
   ...   }
   ... """)

   >>> res.data # doctest: +NORMALIZE_WHITESPACE
   OrderedDict([('region', [OrderedDict([('name', 'AFRICA'),
                                         ('nation_count', 5)]),
                            OrderedDict([('name', 'AMERICA'),
                                         ('nation_count', 5)]),
                            OrderedDict([('name', 'ASIA'),
                                         ('nation_count', 5)]),
                            OrderedDict([('name', 'EUROPE'),
                                         ('nation_count', 5)]),
                            OrderedDict([('name', 'MIDDLE EAST'),
                                         ('nation_count', 5)])]),
                ('settings', OrderedDict([('app_title', 'GraphQL APP')]))])

::

   >>> rex.off()

Database Schema Reflection
==========================

REX.GRAPHQL provides database schema reflection mechanism which can be used to
automatically configure GraphQL API endpoint for any given database. This
feature if useful to quickly scaffold an API for a given database schema.

You need an active Rex application as reflection connects to a database to learn
its schema::

   >>> from rex.core import Rex
   >>> rex = Rex('rex.graphql_demo')
   >>> rex.on()

Then the simplest example of using a reflected GraphQL schema is the following::

   >>> from rex.graphql.reflect import reflect
   >>> from rex.graphql import execute

   >>> reflection = reflect()
   >>> sch = reflection.to_schema()
   >>> data = execute(sch, """
   ...   query {
   ...     region { count }
   ...   }
   ... """).data
   >>> data["region"]["count"]
   5

See :ref:`guide-reflection` for the detailed documentation about this topic.

Common Pitfalls & Problems
==========================

Not all GraphQL features are supported
--------------------------------------

Strictly speaking ``rex.graphql`` is not a GraphQL server as it doesn't support
all features outlined in the GraphQL specification. This might change in the
future as we identify missing pieces.

The following GraphQL features are not supported at the moment:

- Union types
- Interfaces
- Directives
- Subscriptions

::

   >>> rex.off()
