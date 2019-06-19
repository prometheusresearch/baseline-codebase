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

Usage
=====

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
query combinators (see documentation section below) which are compiled into
relational database queries.

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

Note that how both with ``Object`` and ``Entity`` we use ``lambda: ...`` when
defining fields - that allows us to define mutually-recursive types (``nation``
has ``region`` field fo type ``region`` and ``region`` has ``nation`` field of
type ``nation`` in the example above).

2. Create schema
----------------

Now that we have our types defined we need to create a GraphQL schema. Schema
can only be created with an active Rex application as it uses it to validate
types against database schema::

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

Query Combinators
=================

As we've seen above we use programmatically constructed queries to define
GraphQL endpoints for relational databases.

The API for queries is called Query Combinators. This documentation section
attempts to describe it with the help of examples.

First we need an active Rex application so we can execute queries::

   >>> from rex.core import Rex
   >>> rex = Rex('rex.graphql_demo')
   >>> rex.on()

All queries start with an initial query::

   >>> from rex.graphql import q

The meaning of the query is determined by its context (the place it's appearing,
you'll see shortly what it means). Just ``q`` alone represents the entire
database. Unfortunatelly it doesn't makes sense to execute such query as it
would query all the data in a database which would be horribly inefficient.

To query all records from a table called "region" one constructs ``q.region``
which can be read as "navigate from here to 'region'". We can use
``execute_query`` function to execute such query::

   >>> from rex.graphql import execute_q

   >>> query = q.region
   >>> print(execute_q(query)) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
   ({'AFRICA', '...'},
    {'AMERICA', '...'},
    {'ASIA', '...'},
    {'EUROPE', '...'},
    {'MIDDLE EAST', '...'})

If we are interested in names of regions only we can "navigate further" via
``q.region.name`` syntax::

   >>> query = q.region.name
   >>> print(execute_q(query))
   ('AFRICA', 'AMERICA', 'ASIA', 'EUROPE', 'MIDDLE EAST')

Apart from "navigation" Query Combinators API can do more.

Filtering
---------

We can filter results with the ``filter`` combinator.

Let's construct a query which first fetches all nations which have region with
name "AFRICA" and then navigate to names of such nations::

   >>> query = q.nation.filter(q.region.name == "AFRICA").name
   >>> print(execute_q(query))
   ('ALGERIA', 'ETHIOPIA', 'KENYA', 'MOROCCO', 'MOZAMBIQUE')

Notice how we used ``q.region.name`` query inside ``filter`` combinator. That's
what we meant above by queries being context-dependent. Query ``q.region.name``
alone means "names of all regions in the database" while using same query inside
the scope of a nation table the meaning is changed to "a region which correspond
to the current nation".

We used ``==`` operator to check for equality. There are more operators: ``!=``,
``<``, ``>``, ``<=``, ``>=``. Also negation: ``~q``.

Filtering with table id
-----------------------

The attribute id of any particular table has the special type which can be
minted with :func:`rex.graphql.entity_id`::

   >>> from rex.graphql import entity_id, argument

   >>> region_id = entity_id.region

Now we can use it when defininig arguments which compare with ``.id``
attribute::

   >>> query = (
   ...   q.region
   ...      .filter(q.id == argument("id", region_id))
   ...      .select(name=q.name)
   ...      .first()
   ... )
   >>> print(execute_q(query, variables={'id': 'AFRICA'}))
   {'AFRICA'}

Aggregating
-----------

We can apply aggregate functions such as ``count``, ``max``, ``min`` and others
to compute some summaries over data stored in a database.

Let's count all regions::

   >>> query = q.region.count()
   >>> print(execute_q(query))
   5

Grouping
--------

We can also group data into clusters and compute aggregates within those
clusters. We use ``group`` combinator for that::

   >>> query = (
   ...   q.nation
   ...   .group(region_name=q.region.name)
   ...   .select(
   ...     region_name=q.region_name,
   ...     nations_per_region=q.nation.count()
   ...   )
   ... )
   >>> print(execute_q(query))
   ({'AFRICA', 5}, {'AMERICA', 5}, {'ASIA', 5}, {'EUROPE', 5}, {'MIDDLE EAST', 5})

Note that alternatively we can query from regions and compute the same data more
naturally::

   >>> query = (
   ...   q.region
   ...   .select(
   ...     region_name=q.name,
   ...     nations_per_region=q.nation.count()
   ...   )
   ... )
   >>> print(execute_q(query))
   ({'AFRICA', 5}, {'AMERICA', 5}, {'ASIA', 5}, {'EUROPE', 5}, {'MIDDLE EAST', 5})

Limiting the result set
-----------------------

We can limit the number of results we are interested in::

   >>> query = q.region.take(limit=3).name
   >>> print(execute_q(query))
   ('AFRICA', 'AMERICA', 'ASIA')

We can skip first records::

   >>> query = q.region.take(limit=3, offset=1).name
   >>> print(execute_q(query))
   ('AMERICA', 'ASIA', 'EUROPE')

We can "unwrap" the first element of the result set::

   >>> query = q.region.first().name
   >>> print(execute_q(query))
   'AFRICA'

Notice how the result is a single string not a list of strings. Now if the
result we are querying the first element is empty::

   >>> query = q.region.filter(q.name == "ATLANTIDA").first().name
   >>> print(execute_q(query))
   null

::

   >>> rex.off()

Database schema reflection
==========================

``rex.graphql`` provides database schema reflection mechanism which
can be used to automatically configure GraphQL API endpoint for any given
database.

To use reflection API one must have Rex application active as the mechanism
access the database to learn its schema::

   >>> from rex.core import Rex
   >>> rex = Rex('rex.graphql_demo')
   >>> rex.on()

Use ``rex.graphql.reflect.reflect`` function to learn the database schema::

   >>> from rex.graphql import q, query, execute
   >>> from rex.graphql.reflect import reflect

   >>> reflection = reflect()

We can add new fields to reflection before we produce a schema::

   >>> reflection.add_field(
   ...   name="region_count",
   ...   field=query(q.region.count())
   ... )

Then we can obtain GraphQL schema from reflection::

   >>> sch = reflection.to_schema()

Such schema can be used to query for data.

For each database table reflection generates a connection API - a field which
can be used to query a single record, all records, all records by page and count
records in the table.

To query a single record by id ``get`` subfield can be used::

   >>> res = execute(sch, """
   ...   query {
   ...     region {
   ...       africa: get(id: "AFRICA") {
   ...         name
   ...       }
   ...     }
   ...   }
   ... """)
   >>> res.data
   OrderedDict([('region', OrderedDict([('africa', OrderedDict([('name', 'AFRICA')]))]))])

To query all records ``all`` subfield can be used::

   >>> res = execute(sch, """
   ...   query {
   ...     region {
   ...       items: all {
   ...         name
   ...       }
   ...     }
   ...   }
   ... """)
   >>> res.data # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
   OrderedDict([('region',
                 OrderedDict([('items',
                               [OrderedDict([('name', 'AFRICA')]), ...])]))])

We can also query all records using ``paginated`` subfield which canbe passed
``limit: Int`` and ``offset: Int`` arguments::

   >>> res = execute(sch, """
   ...   query {
   ...     region {
   ...       items: paginated(limit: 2, offset: 1) {
   ...         name
   ...       }
   ...     }
   ...   }
   ... """)
   >>> res.data # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
   OrderedDict([('region',
                 OrderedDict([('items',
                               [OrderedDict([('name', 'AMERICA')]), ...])]))])
   >>> len(res.data['region']['items'])
   2

::

   >>> rex.off()

Common Pitfalls & Problems
--------------------------

Not all GraphQL features are supported
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Strictly speaking ``rex.graphql`` is not a GraphQL server as it doesn't support
all features outlined in the GraphQL specification. This might change in the
future as we identify missing pieces.

The following GraphQL features are not supported at the moment:

- Union types
- Interfaces
- Directives
- Subscriptions
