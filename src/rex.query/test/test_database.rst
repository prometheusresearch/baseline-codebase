************
  Database
************

.. contents:: Table of Contents


Executing Queries
=================

We start with creating a demo application::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.query_demo')
    >>> demo.on()

To start executing database queries, we need to create a database instance::

    >>> from rex.query import Database

    >>> db = Database()

Now we can execute queries.  For example, this executes the query ``study``::

    >>> db.produce(["navigate", "study"])                           # doctest: +NORMALIZE_WHITESPACE
    <Product ({'asdl', 'Autism Spectrum Disorder Lab', true},
              {'fos', 'Family Obesity Study', false},
              {'lol', null, true})>

Queries could be also written in JSON object notation::

    >>> db.produce({"op": "navigate", "args": ["study"]})           # doctest: +NORMALIZE_WHITESPACE
    <Product ({'asdl', 'Autism Spectrum Disorder Lab', true},
              {'fos', 'Family Obesity Study', false},
              {'lol', null, true})>

It is possible to specify the number of elements to return::

    >>> db.produce({"syntax": ["navigate", "study"], "limit": 2})
    <Product ({'asdl', 'Autism Spectrum Disorder Lab', true}, {'fos', 'Family Obesity Study', false})>

``study.code`` is expressed this way::

    >>> db.produce([".", ["navigate", "study"], ["navigate", "code"]])
    <Product ('asdl', 'fos', 'lol')>


