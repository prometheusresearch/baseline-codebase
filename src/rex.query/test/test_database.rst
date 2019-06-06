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

Now we can execute queries.  For example, this executes the query ``region``::

    >>> db.produce(["navigate", "region"])                          # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    <Product ({'AFRICA', '...'},
              {'AMERICA', '...'},
              {'ASIA', '...'},
              ...)>

Queries could be also written in JSON object notation::

    >>> db.produce({"op": "navigate", "args": ["region"]})          # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    <Product ({'AFRICA', '...'},
              {'AMERICA', '...'},
              {'ASIA', '...'},
              ...)>

It is possible to specify the number of elements to return::

    >>> db.produce({"syntax": ["navigate", "region"], "limit": 2})  # doctest: +ELLIPSIS
    <Product ({'AFRICA', 'lar deposits. ...'}, {'AMERICA', '... requests. s'})>

``region.name`` is expressed this way::

    >>> db.produce([".", ["navigate", "region"], ["navigate", "name"]]) # doctest: +ELLIPSIS
    <Product ('AFRICA', 'AMERICA', 'ASIA', 'EUROPE', 'MIDDLE EAST')>

To show more than one field in the output, we use the ``select`` combinator::

    >>> db.produce(
    ...     ["select",
    ...         ["navigate", "region"],
    ...         ["navigate", "name"],
    ...         [".", ["navigate", "nation"], ["navigate", "name"]]])   # doctest: +ELLIPSIS
    <Product ({'AFRICA', ('ALGERIA', 'ETHIOPIA', ...)}, {'AMERICA', ('ARGENTINA', 'BRAZIL', ...)}, ...)>

    >>> db.produce(
    ...     ["select",
    ...         [".", ["navigate", "region"], ["navigate", "nation"]],
    ...         ["navigate", "name"]])                                  # doctest: +ELLIPSIS
    <Product ({'ALGERIA'}, {'ETHIOPIA'}, ...)>

    >>> db.produce(
    ...     ["select",
    ...         [".",["navigate","region"], ["navigate","nation"]],
    ...         ["navigate","name"],
    ...         ["navigate","region"],
    ...         ["navigate","comment"],
    ...         ["navigate","customer"]])                               # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    <Product ({'ALGERIA', [AFRICA], '...',
                ({'Customer#000000029', '...', [ALGERIA], '10-773-203-7342', 7618.27, 'FURNITURE', '...'},
                 ...)}, ...)>

    >>> db.produce(
    ...     ["select",
    ...         ["here"],
    ...         ["=>", "num_customer", ["count", ["navigate", "customer"]]],
    ...         ["=>", "num_supplier", ["count", ["navigate", "supplier"]]]])
    <Product {1200, 80}>

For complex expressions, we could define aliases with ``define``::

    >>> db.produce(
    ...     ["select",
    ...         ["define",
    ...             ["navigate", "supplier"],
    ...             ["=>", "country", [".", ["navigate", "nation"], ["navigate", "name"]]]],
    ...         ["navigate", "name"], ["navigate", "country"]])     # doctest: +ELLIPSIS
    <Product ({'Supplier#000000001', 'PERU'}, {'Supplier#000000002', 'ETHIOPIA'}, ...)>

Constants::

    >>> db.produce(["select", ["here"], None, True, 64, 3.14, "htsql"])
    <Product {null, true, 64, 3.14, 'htsql'}>

Arithmetic operations::

    >>> db.produce(["+", 9, 3])
    <Product 12>

    >>> db.produce(["+", "rab", "bit"])
    <Product 'rabbit'>

    >>> db.produce(["-", 9, 3])
    <Product 6>

    >>> db.produce(["*", 9, 3])
    <Product 27>

    >>> db.produce(["/", 9, 3])
    <Product 3.0000000000000000>

Comparison operations::

    >>> db.produce(["=", 5, 7])
    <Product false>

    >>> db.produce(["!=", 5, 7])
    <Product true>

    >>> db.produce(["<", 5, 7])
    <Product true>

    >>> db.produce(["<=", 5, 7])
    <Product true>

    >>> db.produce([">", 5, 7])
    <Product false>

    >>> db.produce([">=", 5, 7])
    <Product false>

Logical operations::

    >>> db.produce(["&"])
    <Product true>

    >>> db.produce(["&", [">=", 7, 5]])
    <Product true>

    >>> db.produce(["&", [">=", 7, 5], ["<=", 5, 7], ["=", 5, 7]])
    <Product false>

    >>> db.produce(["|"])
    <Product false>

    >>> db.produce(["|", [">=", 7, 5]])
    <Product true>

    >>> db.produce(["|", [">=", 7, 5], ["<=", 5, 7], ["=", 5, 7]])
    <Product true>

    >>> db.produce(["!", True])
    <Product false>

Filtering::

    >>> db.produce(
    ...     ["filter",
    ...         ["navigate", "customer"],
    ...         [">", ["navigate", "acctbal"], 9950]])  # doctest: +ELLIPSIS
    <Product ({'Customer#000000045', ..., 9983.38, 'AUTOMOBILE', ...}, ...)>

    >>> db.produce(
    ...     ["filter",
    ...         ["navigate", "customer"],
    ...         ["!", ["exists", ["navigate", "order"]]]])  # doctest: +ELLIPSIS
    <Product ({'Customer#000000003', ...}, {'Customer#000000006', ...}, ...)>

    >>> db.produce(
    ...     [".",
    ...         ["filter",
    ...             ["navigate", "nation"],
    ...             ["~",
    ...                 [".", ["navigate", "region"], ["navigate", "name"]],
    ...                 "asia"]],
    ...         ["navigate", "customer"],
    ...         ["navigate", "name"]])                      # doctest: +ELLIPSIS
    <Product ('Customer#000000007', 'Customer#000000019', ...)>

Filtering works correctly with define::

    >>> db.produce(
    ...     [".",
    ...         ["filter",
    ...             ["define",
    ...                 ["navigate", "region"],
    ...                 ["=>", "nation", [".", ["navigate", "nation"], ["navigate", "name"]]]],
    ...             ["=", ["navigate", "name"], "ASIA"]],
    ...         ["navigate", "nation"]])
    <Product ('CHINA', 'INDIA', 'INDONESIA', 'JAPAN', 'VIETNAM')>

Filtering also works with identities::

    >>> db.produce(
    ...     ["filter",
    ...         ["navigate", "nation"],
    ...         ["=", ["navigate", "region"], "'MIDDLE EAST'"]])        # doctest: +ELLIPSIS
    <Product ({'EGYPT', ['MIDDLE EAST'], '...'}, ...)>

    >>> db.produce(
    ...     ["filter",
    ...         ["navigate", "lineitem"],
    ...         ["=",
    ...             [".", ["navigate", "partsupp"], ["id"]],
    ...             "'yellow white ghost lavender salmon'.'Supplier#000000069'"]])  # doctest: +ELLIPSIS
    <Product ({[3719], ['yellow white ghost lavender salmon'.'Supplier#000000069'], ...}, ...)>

A list of identities could be generated with::

    >>> db.produce(
    ...     [".",
    ...         ["navigate", "region"],
    ...         ["navigate", "id"]])
    <Product ([AFRICA], [AMERICA], [ASIA], [EUROPE], ['MIDDLE EAST'])>

Sorting::

    >>> db.produce(
    ...     ["select",
    ...         ["sort",
    ...             ["navigate", "customer"],
    ...             ["desc", ["navigate", "acctbal"]]],
    ...         ["navigate", "name"],
    ...         ["navigate", "acctbal"]])   # doctest: +ELLIPSIS
    <Product ({'Customer#000000213', 9987.71}, {'Customer#000000045', 9983.38}, ...)>

    >>> db.produce(
    ...     ["select",
    ...         ["sort",
    ...             ["navigate", "customer"],
    ...             ["desc", ["navigate", "nation"]]],
    ...         ["navigate", "name"],
    ...         ["navigate", "nation"]])   # doctest: +ELLIPSIS
    <Product ({'Customer#000000036', [VIETNAM]}, ..., {'Customer#000001197', [ALGERIA]})>

Pagination::

    >>> db.produce(
    ...     ["select",
    ...         ["take",
    ...             ["navigate", "nation"],
    ...             3],
    ...         ["navigate", "name"]])
    <Product ({'ALGERIA'}, {'ARGENTINA'}, {'BRAZIL'})>

Pagination with offset::

    >>> db.produce(
    ...     ["select",
    ...         ["take",
    ...             ["navigate", "nation"],
    ...             3, 1],
    ...         ["navigate", "name"]])
    <Product ({'ARGENTINA'}, {'BRAZIL'}, {'CANADA'})>

Acccessing the first element::

    >>> db.produce(
    ...     ["select",
    ...         ["first",
    ...             ["navigate", "nation"]],
    ...         ["navigate", "name"]])
    <Product {'ALGERIA'}>

Acccessing the first element (after select)::

    >>> db.produce(
    ...     ["first",
    ...         ["select",
    ...             ["navigate", "nation"],
    ...             ["navigate", "name"]]])
    <Product {'ALGERIA'}>

Using query variables::

    >>> db.produce(
    ...     ["filter",
    ...         ["navigate", "nation"],
    ...         ["=", ["navigate", "region"], ["var", "region"]]],
    ...     values={'region': "'MIDDLE EAST'"}
    ... ) # doctest: +ELLIPSIS
    <Product ({'EGYPT', ['MIDDLE EAST'], '...'}, ...)>

Type conversion::

    >>> db.produce(["+", ["date", "2016-09-13"], 10])
    <Product '2016-09-23'>

Aggregates::

    >>> db.produce(
    ...     ["select",
    ...         ["filter",
    ...             ["navigate", "customer"],
    ...             ["exists", ["order"]]],
    ...         ["name"],
    ...         ["count", ["order"]],
    ...         ["sum", [".", ["order"], ["totalprice"]]]])     # doctest: +ELLIPSIS
    <Product ({'Customer#000000001', 8, 1129859.43}, {'Customer#000000002', 14, 1733607.99}, ...)>

Grouping::

    >>> db.produce(["group", ["order"], ["orderstatus"]])
    <Product ({'F'}, {'O'}, {'P'})>

Grouping and complement::

    >>> db.produce(
    ...     ["select",
    ...         ["group", ["order"], ["orderstatus"]],
    ...         ["orderstatus"],
    ...         ["order"]])     # doctest: +ELLIPSIS
    <Product ({'F', ({3, ['Customer#000000988'], 'F', ...}, ...)}, {'O', ({1, ['Customer#000000296'], 'O', ...}, ...)}, ...)>

Grouping and aggregates::

    >>> db.produce(
    ...     ["select",
    ...         ["group", ["order"], ["orderstatus"]],
    ...         ["orderstatus"],
    ...         ["count", ["order"]],
    ...         ["max", [".", ["order"], ["lineitem"], ["quantity"]]]])
    <Product ({'F', 5849, 50}, {'O', 5857, 50}, {'P', 294, 50})>


Handling HTTP Requests
======================

Queries could be submitted in an HTTP request::

    >>> from webob import Request

    >>> req = Request.blank("/", POST='{"syntax": ["region"], "format": "x-htsql/json"}')
    >>> print(db(req))       # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    ...
    {
      "region": [
        {
          "name": "AFRICA",
          "comment": "..."
        },
        ...
      ]
    }


Metadata
========

To get the structure of the database, we use the ``catalog`` command::

    >>> req = Request.blank("/", POST='["catalog"]')
    >>> print(db(req))       # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    ...
     | entity                                                                                                                                              |
     +----------+----------+------------------------------------------------------------------------------------------------------------------+------------+
     |          |          | field                                                                                                            |            |
     |          |          +---------------+---------------+--------+---------+--------+---------------+----------------+---------------------+            |
     |          |          |               |               |        |         |        |               | column         | link                |            |
     |          |          |               |               |        |         |        |               +---------+------+----------+----------+            |
     | name     | label    | label         | title         | public | partial | plural | kind          | type    | enum | target   | inverse  | identity   |
    -+----------+----------+---------------+---------------+--------+---------+--------+---------------+---------+------+----------+----------+------------+-
     | customer | Customer | name          | Name          | true   | false   | false  | column        | text    |      :          :          | name       |
     :          :          | address       | Address       | true   | false   | false  | column        | text    |      :          :          :            :
     :          :          | nation        | Nation        | true   | false   | false  | direct-link   |         :      | nation   | customer |            :
     :          :          | phone         | Phone         | true   | false   | false  | column        | text    |      :          :          :            :
     :          :          | acctbal       | Acctbal       | true   | false   | false  | column        | decimal |      :          :          :            :
    ...



