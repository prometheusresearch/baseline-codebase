*****************************
  REX.GRAPHQL API Reference
*****************************

rex.graphql
===========

This module provides API to define a GraphQL schema and execute query against
it.

.. autofunction:: rex.graphql.schema

.. class:: rex.graphql.Schema

   GraphQL schema.

Abstract Base Classes
---------------------

GraphQL type system consist of two main primitives: types and fields. Fields can
have parameters. Here we have abstract base classes which represent those.

.. autoclass:: rex.graphql.Type
.. autoclass:: rex.graphql.Field
.. autoclass:: rex.graphql.Param

Computed Fields
---------------

This API allows to define computed fields. They should be used as parts of an
:class:`Object` type.

.. autofunction:: rex.graphql.compute
.. autofunction:: rex.graphql.compute_from_function

Query Fields
------------

This API allows to define query fields. They should be used as parts of an
:class:`Entity` or a :class:`Record` type.

.. autofunction:: rex.graphql.query
.. autofunction:: rex.graphql.connect
.. autofunction:: rex.graphql.filter_from_function

Types
-----

Scalars
~~~~~~~

.. autodata:: rex.graphql.scalar

Object, List, NonNull
~~~~~~~~~~~~~~~~~~~~~

Types used to describe values computed at runtime.

.. autoclass:: rex.graphql.Object
.. autoclass:: rex.graphql.List
.. autoclass:: rex.graphql.NonNull

Enum
~~~~

Types used to describe enumerations.

.. note::
   We use another representation for enum database types as standard GraphQL
   Enum is too restrictive - it doesn't allow enum values to have dashes ``-``
   in it in particular.

.. autoclass:: rex.graphql.Enum
.. autoclass:: rex.graphql.EnumValue

Database Types
~~~~~~~~~~~~~~

Types used to describe :func:`query` field results.

.. autoclass:: rex.graphql.Entity
.. autoclass:: rex.graphql.Record

Parameters
----------

Both computed and query fields can have parameters. Parameters can be supplied
either via GraphQL arguments or by other means (such as by looking up a value
from context).

.. autofunction:: rex.graphql.argument
.. autofunction:: rex.graphql.param
.. autodata:: rex.graphql.parent_param

Execution
---------

GraphQL query execution API.

.. autofunction:: rex.graphql.execute

.. autoclass:: rex.graphql.Result

.. exception:: rex.graphql.GraphQLError

   Exception raised during execution of a GraphQL query.

rex.graphql.serve
=================

This module provides utilities to serve GraphQL queries over HTTP.

.. autofunction:: rex.graphql.serve.serve

rex.graphql.reflect
===================

This module provides reflection API to construct GraphQL schemas out of database
schemas automatically.

.. autofunction:: rex.graphql.reflect.reflect
.. class:: rex.graphql.reflect.Reflect

   .. autoattribute:: types
   .. autoattribute:: fields
   .. automethod:: to_schema
