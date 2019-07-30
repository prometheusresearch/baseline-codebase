.. _guide-db-queries:

********************************
  REX.GRAPHQL Database Queries
********************************

.. contents:: Table of Contents

To query a relational database with ``rex.graphql`` one needs to describe how
relational database is exposed through the GraphQL. This is done by defining a
set of types and relationships between them.

Below we will go through the set of examples on how to define such types.

First, we need an active Rex application::

   >>> from rex.core import Rex
   >>> rex = Rex('rex.graphql_demo')
   >>> rex.on()

   >>> from rex.graphql import schema, execute

Query Scalar Values
===================

The simplest case of queries are queries which result in scalar values, let's
count the number of region in the database::

   >>> from rex.graphql import query, q

   >>> sch = schema(fields=lambda: {
   ...   'region_count': query(q.region.count()),
   ... })

As you can see we've defined a schema which uses :func:`rex.graphql.query`
field. Such field is configured with a query constructed via ``q`` Query
Combinators API (see :ref:`guide-query-combinators` for the guide on how to
construct such queries).

For such simple queries we don't need to specify the result type as we can infer
from a database schema that the result of this field is an integer (it's a count
after all!).

Let's execute GraphQL queries against this schema::

   >>> res = execute(sch, "{ region_count }")
   >>> assert res.errors is None
   >>> assert res.data == {'region_count': 5}

Now we will consider more interesting cases.

Query Tables
============

Now if we want to query rows from some table we need to describe the type of
such rows. This is done via :class:`rex.graphql.Entity` type constructor.

Let's describe the type for the ``region`` table::

   >>> from rex.graphql import Entity

   >>> region = Entity(name="region", fields=lambda: {
   ...   'name': query(q.name),
   ...   'nation_count': query(q.nation.count()),
   ... })

With fields we describe which columns we want to expose (``name`` field in this
example) and which queries we allow to be performed (``nation_count`` field in
this example).

Note that :class:`rex.graphql.Entity` automatically adds a field ``id`` which
queries the corresponding table's primary key.

Finally we can specify how we query for values of such type::

   >>> sch = schema(fields=lambda: {
   ...   'region': query(q.region, type=region),
   ...   'first_region': query(q.region.first(), type=region),
   ... })

Here we defined a schema which can query both for a list of regions and for the
first region row. Because such queries result in a non scalar type - we need to
provide a ``type`` argument. Note that we don't need to specify cardinality
though, this information is inferred from the query itself.

Let's execute a query against this schema::

   >>> result = execute(sch, """
   ...   {
   ...     region { id, name, nation_count }
   ...     first_region { name }
   ...   }
   ... """)
   >>> assert result.data == {
   ...   'region': [
   ...     {'id': 'AFRICA', 'name': 'AFRICA', 'nation_count': 5},
   ...     {'id': 'AMERICA', 'name': 'AMERICA', 'nation_count': 5},
   ...     {'id': 'ASIA', 'name': 'ASIA', 'nation_count': 5},
   ...     {'id': 'EUROPE', 'name': 'EUROPE', 'nation_count': 5},
   ...     {'id': "'MIDDLE EAST'", 'name': 'MIDDLE EAST', 'nation_count': 5},
   ...   ],
   ...   'first_region': {
   ...     'name': 'AFRICA',
   ...   }
   ... }

Query with Filters
==================

Not always your queries are constant, sometimes you want to parametrize query
with an argument and filter the result based on the argument value.

First we need to define an argument::

   >>> from rex.graphql import argument, scalar

   >>> arg_name = argument(
   ...   name="name",
   ...   type=scalar.String,
   ...   description="Region name"
   ... )

Now that we have an argument we can define a filter which is just a query
defined via Query Combinators API::

   >>> from rex.graphql import q

   >>> by_name = q.name == arg_name

Optional/Conditional Filters
----------------------------

We can use such filter differently, one way is to pass ``by_name`` as
``filters`` argument when defining a query::

   >>> sch = schema(fields=lambda: {
   ...   'region': query(q.region, type=region, filters=[by_name])
   ... })

That way this filter is optional - if ``name`` argument is not specified then
filter won't be applied::

   >>> result = execute(sch, """
   ...   {
   ...     region { name }
   ...   }
   ... """)
   >>> assert result.data == {
   ...   'region': [
   ...     {'name': 'AFRICA'},
   ...     {'name': 'AMERICA'},
   ...     {'name': 'ASIA'},
   ...     {'name': 'EUROPE'},
   ...     {'name': 'MIDDLE EAST'},
   ...   ],
   ... }

But if we pass ``name`` then the filter is applied and we receive only rows
which conform to the filter's condition::

   >>> result = execute(sch, """
   ...   {
   ...     region(name: "ASIA") { name }
   ...   }
   ... """)
   >>> assert result.data == {
   ...   'region': [
   ...     { 'name': 'ASIA'},
   ...   ],
   ... }

Required/Unconditional Filters
------------------------------

Now let's see how we can define unconditional filters. For that we need to use
``by_name`` query as part of the query which queries regions::

   >>> sch = schema(fields=lambda: {
   ...   'region': query(q.region.filter(by_name), type=region)
   ... })

It's an error not to pass ``name`` argument now::

   >>> result = execute(sch, """
   ...   {
   ...     region { name }
   ...   }
   ... """)
   >>> result.errors
   [GraphQLError('Argument "name" of required type String!" was not provided.',)]

But if we pass ``name`` then everything is ok::

   >>> result = execute(sch, """
   ...   {
   ...     region(name: "ASIA") { name }
   ...   }
   ... """)
   >>> assert result.data == {
   ...   'region': [
   ...     {'name': 'ASIA'},
   ...   ],
   ... }

Advanced Filters
----------------

There's another way to define filters by using a function which can yield
multiple query clauses whcih are then used for filters. Such filters are more
powerful as they can use arbitrary logic to decide how to filter the result.

The downside is that such filters are not checked at the application
initialisation and thus any error in such filters will happen at the application
runtime.

Having said that, there are some cases when such queries are useful. One of the
is to define a filter which filters by comparing an record's ``id`` column to
one of multiple values::

   >>> from rex.graphql import filter_from_function, entity_id, List

   >>> @filter_from_function()
   ... def by_id(ids: List(entity_id.region) = None):
   ...     if ids is not None:
   ...         yield q.id == ids

   >>> sch = schema(fields=lambda: {
   ...   'region': query(q.region, type=region, filters=[by_id])
   ... })

   >>> result = execute(sch, """
   ...   {
   ...     region(ids: ["ASIA", "AMERICA"]) { name }
   ...   }
   ... """)
   >>> assert result.data == {
   ...   'region': [
   ...     {'name': 'AMERICA'},
   ...     {'name': 'ASIA'},
   ...   ],
   ... }

Sorting
=======

To specify sort order one can use ``sort`` argument and specify the query to be
used to sort by::

   >>> sch = schema(fields=lambda: {
   ...   'region': query(q.region, type=region, sort=q.name.desc())
   ... })
   >>> result = execute(sch, """
   ...   {
   ...     region { name }
   ...   }
   ... """)
   >>> assert result.data == {
   ...   'region': [
   ...     {'name': 'MIDDLE EAST'},
   ...     {'name': 'EUROPE'},
   ...     {'name': 'ASIA'},
   ...     {'name': 'AMERICA'},
   ...     {'name': 'AFRICA'},
   ...   ],
   ... }

This defines a schema which queries regions by sorting by name in descending
order, if one needs to sort in ascending order — they can use
``sort=q.name.asc()`` query.
