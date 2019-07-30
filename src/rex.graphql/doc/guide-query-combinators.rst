.. _guide-query-combinators:

*********************************
  REX.GRAPHQL Query Combinators
*********************************

As we've seen we use programmatically constructed queries to define GraphQL
endpoints for relational databases with :func:`rex.graphql.query`.

The API for queries is called Query Combinators. This documentation section
attempts to describe it with the help of examples.

First we need an active Rex application so we can execute queries::

   >>> from rex.core import Rex
   >>> rex = Rex('rex.graphql_demo')
   >>> rex.on()

In this documentation we will use a special function ``execute_q`` to execute
queries defined with Query Combinators API::

   >>> from rex.graphql import execute_q

Note that while using rex.graphql you won't need to use that function as
relational queries will be executed instead as a part of processing a GraphQL
query.

All queries start with an initial query::

   >>> from rex.graphql import q

The meaning of the query is determined by its context (the place it's appearing,
you'll see shortly what it means). Just ``q`` alone represents the entire
database. Unfortunatelly it doesn't makes sense to execute such query as it
would query all the data in a database which would be horribly inefficient.

To query all records from a table called "region" one constructs ``q.region``
which can be read as "navigate from here to 'region'". We can use
``execute_query`` function to execute such query::

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
=========

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
=======================

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
===========

We can apply aggregate functions such as ``count``, ``max``, ``min`` and others
to compute some summaries over data stored in a database.

Let's count all regions::

   >>> query = q.region.count()
   >>> print(execute_q(query))
   5

Grouping
========

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
=======================

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


