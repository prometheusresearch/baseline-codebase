.. _guide-reflection:

********************************
  REX.GRAPHQL Reflection Guide
********************************

REX.GRAPHQL provides database schema reflection mechanism which can be used to
automatically configure a GraphQL schema for any given database.

.. contents:: Table of Contents

Basic Usage
===========

To use reflection API one must have Rex application active as the mechanism
access the database to learn its schema::

   >>> from rex.core import Rex
   >>> rex = Rex('rex.graphql_demo')
   >>> rex.on()

Use ``rex.graphql.reflect.reflect`` function to learn database schema and
produce a ``reflection``, an instance of :class:`Reflect`. Such object is then
used to produce GraphQL Schema via ``to_schema`` method::

   >>> from rex.graphql import execute
   >>> from rex.graphql.reflect import reflect

   >>> reflection = reflect()

You can access reflected types via ``types`` dict and reflected fields via
``fields``::

   >>> 'region' in reflection.types
   True
   >>> 'nation' in reflection.types
   True

We can obtain the reflected schema via ``to_schema`` method::

   >>> sch = reflection.to_schema()

The best way to explore the reflected schema is to use GraphiQL console which is
available through the :func:`rex.graphql.serve.serve` function on the URL you
are serving your GraphQL endpoint.

Below we explore some of the reflected schema features.

Querying tables
~~~~~~~~~~~~~~~

For each table reflection produces a single field on the ``Root`` type which
enable a number of access patterns documented below.

Query for a record by id
------------------------

To query a single record by id ``get(id)`` field can be used::

   >>> res = execute(sch, """
   ...   query {
   ...     region {
   ...       africa: get(id: "AFRICA") {
   ...         name
   ...       }
   ...     }
   ...   }
   ... """)
   >>> res.data # doctest: +NORMALIZE_WHITESPACE
   OrderedDict([('region',
                 OrderedDict([('africa', OrderedDict([('name', 'AFRICA')]))]))])

Query for all records
---------------------

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

We can also query all records using ``paginated`` field which can be passed
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

Query for record count
----------------------

Finally we can count the number of records::

   >>> res = execute(sch, """
   ...   query {
   ...     region {
   ...       count
   ...     }
   ...   }
   ... """)
   >>> res.data
   OrderedDict([('region', OrderedDict([('count', 5)]))])

Querying many-to-one/one-to-one links
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For each many-to-one/one-to-many link reflection produces a field which allows
to query a related record. For example we know that ``nation`` links to a
``region`` table and thus we can query it like this::

   >>> res = execute(sch, """
   ...   query {
   ...     nation {
   ...       russia: get(id: "RUSSIA") {
   ...         region { name }
   ...       }
   ...     }
   ...   }
   ... """)
   >>> res.data["nation"]["russia"]
   OrderedDict([('region', OrderedDict([('name', 'EUROPE')]))])

Querying many-to-many/one-to-many
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For each many-to-many/one-to-many link reflection produces a field of the same
type as for tables: with ``get(id)``, ``all``, ``paginated`` and ``count``
subfields.

Example query for a list of nations for the specific region::

   >>> res = execute(sch, """
   ...   query {
   ...     region {
   ...       asia: get(id: "ASIA") {
   ...         name
   ...         nation {
   ...            all { name }
   ...         }
   ...       }
   ...     }
   ...   }
   ... """)
   >>> res.data["region"]["asia"]["name"]
   'ASIA'
   >>> res.data["region"]["asia"]["nation"]["all"] # doctest: +NORMALIZE_WHITESPACE
   [OrderedDict([('name', 'CHINA')]),
    OrderedDict([('name', 'INDIA')]),
    OrderedDict([('name', 'INDONESIA')]),
    OrderedDict([('name', 'JAPAN')]),
    OrderedDict([('name', 'VIETNAM')])]

There's also ``get(id)``, ``paginated`` and ``count``.

Enhancing Reflected Schema
==========================

Sometimes you want to tweak reflected schema a bit by adding new fields/filters
or restrict a set of tables to be reflected from a database.

Restricting Reflected Tables
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We can use ``include_tables`` argument to specify which tables should be
reflected from a database::

   >>> reflection = reflect(include_tables={'region'})
   >>> 'region' in reflection.types
   True
   >>> 'nation' in reflection.types
   False
   >>> 'order' in reflection.types
   False

Alternatively you can exclude tables with ``exclude_tables`` argument::

   >>> reflection = reflect(exclude_tables={'nation'})
   >>> 'region' in reflection.types
   True
   >>> 'nation' in reflection.types
   False
   >>> 'order' in reflection.types
   True

Adding Fields to Schema
~~~~~~~~~~~~~~~~~~~~~~~

After we created a reflection::

   >>> reflection = reflect()

We can add new fields to reflected schema with :meth:`Reflect.add_field()`
method.

We can define new query fields::

   >>> from rex.graphql import q, query

   >>> reflection.add_field(
   ...   name="region_count",
   ...   field=query(q.region.count())
   ... )

As well as computed fields::

   >>> from rex.graphql import compute_from_function, scalar

   >>> @reflection.add_field()
   ... @compute_from_function()
   ... def addone(num: scalar.Int) -> scalar.Int:
   ...     return num + 1

Those fields can be queries as usual::

   >>> sch = reflection.to_schema()

   >>> execute(sch, """
   ...   query {
   ...     region_count
   ...   }
   ... """).data
   OrderedDict([('region_count', 5)])

   >>> execute(sch, """
   ...   query {
   ...     addone(num: 42)
   ...   }
   ... """).data
   OrderedDict([('addone', 43)])

Adding Fields to Reflected Entities
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sometimes you want to add a field to a specified reflected type. You can do that
too by first obtaining the reference to the type via ``types``::

   >>> reflection = reflect()
   >>> region = reflection.types['region']

Lets add a field which returns a list of names of related nations::

   >>> from rex.graphql import q, query

   >>> region.add_field(
   ...   name="nation_names",
   ...   field=query(q.nation.name)
   ... )

Then we can query for it::

   >>> sch = reflection.to_schema()

   >>> execute(sch, """
   ...   query {
   ...     region {
   ...       africa: get(id: "AFRICA") {
   ...         nation_names
   ...       }
   ...     }
   ...   }
   ... """).data["region"]["africa"] # doctest: +NORMALIZE_WHITESPACE
   OrderedDict([('nation_names',
                 ['ALGERIA', 'ETHIOPIA', 'KENYA', 'MOROCCO', 'MOZAMBIQUE'])])

Adding Filters to Reflected Fields
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

It can be useful to add some custom filters to fields reflected from a database
schema. For that you need to obtain the field of interest first::

   >>> reflection = reflect()
   >>> all_regions = reflection.fields['region'].type.fields['all']

Now we can use :meth:`QueryField.add_filter()` method to add a new filter::

   >>> from rex.graphql import filter_from_function, scalar, q

   >>> @all_regions.add_filter()
   ... @filter_from_function()
   ... def search_by_name(search: scalar.String = None):
   ...     if search is not None:
   ...         yield q.name.matches(search)

Let's use it::

   >>> sch = reflection.to_schema()

   >>> execute(sch, """
   ...   query {
   ...     region {
   ...       all(search: "A") {
   ...         name
   ...       }
   ...     }
   ...   }
   ... """).data["region"]["all"] # doctest: +NORMALIZE_WHITESPACE
   [OrderedDict([('name', 'AFRICA')]),
    OrderedDict([('name', 'AMERICA')]),
    OrderedDict([('name', 'ASIA')]),
    OrderedDict([('name', 'MIDDLE EAST')])]

Customizing Result Order
~~~~~~~~~~~~~~~~~~~~~~~~

In some cases you might want to customize the result order for reflected fields.
First you need to obtain a reference to a query field::

   >>> reflection = reflect()
   >>> all_regions = reflection.fields['region'].type.fields['all']

Then you can use ``set_sort`` method to set the query which will be using for
sorting::

   >>> from rex.graphql import q

   >>> all_regions.set_sort(q.name.desc())

Let's see how it works::

   >>> sch = reflection.to_schema()
   >>> execute(sch, """
   ...   query {
   ...     region {
   ...       all {
   ...         name
   ...       }
   ...     }
   ...   }
   ... """).data["region"]["all"] # doctest: +NORMALIZE_WHITESPACE
   [OrderedDict([('name', 'MIDDLE EAST')]),
    OrderedDict([('name', 'EUROPE')]),
    OrderedDict([('name', 'ASIA')]),
    OrderedDict([('name', 'AMERICA')]),
    OrderedDict([('name', 'AFRICA')])]

::

   >>> rex.off()
