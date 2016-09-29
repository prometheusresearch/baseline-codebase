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

To show more than one field in the output, we use the ``select`` combinator::

    >>> db.produce(
    ...     ["select",
    ...         ["navigate", "study"],
    ...         ["navigate", "title"],
    ...         [".", ["navigate", "protocol"], ["navigate", "title"]]])    # doctest: +ELLIPSIS
    <Product ({'Autism Spectrum Disorder Lab', ('Aspergers Individual', 'Autistic Individual', 'Control Individual')}, ...>

    >>> db.produce(
    ...     ["select",
    ...         [".", ["navigate", "identity"], ["navigate", "individual"]],
    ...         ["navigate", "code"]])                                      # doctest: +ELLIPSIS
    <Product ({'1000'}, {'1001'}, ...)>

    >>> db.produce(
    ...     ["select",
    ...         [".",["navigate","identity"], ["navigate","individual"]],
    ...         ["navigate","code"],
    ...         ["navigate","sex"],
    ...         ["navigate","mother"],
    ...         ["navigate","father"],
    ...         ["navigate","identity"],
    ...         ["navigate","individual_via_mother"],
    ...         ["navigate","individual_via_father"],
    ...         ["navigate","participation"]])                              # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    <Product ({'1000', 'female', null, null, {[1000], 'May', 'Kanaris', '1961-01-01'},
              ({'1002', 'female', [1000], [1001]},
               {'1003', 'male', [1000], [1001]},
               {'1004', 'male', [1000], [1001]}),
              (), ({[1000], [fos.mother], '1'},)}, ...)>

    >>> db.produce(
    ...     ["select",
    ...         ["here"],
    ...         ["=>", "num_study", ["count", ["navigate", "study"]]],
    ...         ["=>", "num_individual", ["count", ["navigate", "individual"]]]])
    <Product {3, 98}>

Constants::

    >>> db.produce(["select", "here", None, True, 64, 3.14, "htsql"])
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

Filtering::

    >>> db.produce(
    ...     ["filter",
    ...         ["navigate", "individual"],
    ...         ["=", ["navigate", "sex"], "female"]])  # doctest: +ELLIPSIS
    <Product ({'1000', 'female', null, null}, {'1002', 'female', [1000], [1001]}, ...>

Sorting::

    >>> db.produce(
    ...     ["select",
    ...         ["sort",
    ...             ["define",
    ...                 ["navigate", "individual"],
    ...                 ["=>", "dob", [".", ["navigate", "identity"], ["navigate", "birthdate"]]]],
    ...             ["desc", ["navigate", "dob"]]],
    ...         ["navigate", "code"],
    ...         ["navigate", "dob"]])   # doctest: +ELLIPSIS
    <Product ({'1093', '2009-03-03'}, {'1018', '2008-08-08'}, ...>

Type conversion::

    >>> db.produce(["+", ["date", "2016-09-13"], 10])
    <Product '2016-09-23'>

Aggregates::

    >>> db.produce(
    ...     ["select",
    ...         ["filter",
    ...             ["define",
    ...                 ["navigate", "study"],
    ...                 ["=>", "individual", [".", ["protocol"], ["participation"], ["individual"]]],
    ...                 ["=>", "dob", [".", ["individual"], ["identity"], ["birthdate"]]]],
    ...             ["exists", ["individual"]]],
    ...         ["code"],
    ...         ["count", ["individual"]],
    ...         ["min", ["dob"]]])
    <Product ({'fos', 97, '1941-02-02'},)>

Grouping::

    >>> db.produce(["group", ["individual"], ["sex"]])
    <Product ({'male'}, {'female'})>

Grouping and complement::

    >>> db.produce(
    ...     ["select",
    ...         ["group", ["individual"], ["sex"]],
    ...         ["sex"],
    ...         ["individual"]])    # doctest: +ELLIPSIS
    <Product ({'male', ({'1001', 'male', null, null}, ...)}, {'female', ({'1000', 'female', null, null}, ...)})>

Grouping and aggregates::

    >>> db.produce(
    ...     ["select",
    ...         ["group", ["individual"], ["sex"]],
    ...         ["sex"],
    ...         ["count", ["individual"]],
    ...         ["max", [".", ["individual"], ["identity"], ["birthdate"]]]])
    <Product ({'male', 57, '2009-03-03'}, {'female', 41, '2007-01-03'})>


Handling HTTP Requests
======================

Queries could be submitted in an HTTP request::

    >>> from webob import Request

    >>> req = Request.blank("/", POST='{"syntax": ["study"], "format": "x-htsql/json"}')
    >>> print db(req)       # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    ...
    {
      "study": [
        {
          "code": "asdl",
          "title": "Autism Spectrum Disorder Lab",
          "closed": true
        },
        ...
      ]
    }


Metadata
========

To get the structure of the database, we use the ``catalog`` command::

    >>> req = Request.blank("/", POST='["catalog"]')
    >>> print db(req)       # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    ...
     | entity                                                                                                                                                                                                    |
     +---------------+---------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------+------------+
     |               |               | field                                                                                                                                                        |            |
     |               |               +-----------------------+-----------------------+--------+---------+--------+---------------+--------------------------+---------------------------------------+            |
     |               |               |                       |                       |        |         |        |               | column                   | link                                  |            |
     |               |               |                       |                       |        |         |        |               +---------+----------------+---------------+-----------------------+            |
     | name          | label         | label                 | title                 | public | partial | plural | kind          | type    | enum           | target        | inverse               | identity   |
    -+---------------+---------------+-----------------------+-----------------------+--------+---------+--------+---------------+---------+----------------+---------------+-----------------------+------------+-
     | identity      | Identity      | individual            | Individual            | true   | false   | false  | direct-link   |         :                | individual    | identity              | individual |
     :               :               | givenname             | Givenname             | true   | true    | false  | column        | text    |                :               :                       :            :
     :               :               | surname               | Surname               | true   | true    | false  | column        | text    |                :               :                       :            :
     :               :               | birthdate             | Birthdate             | true   | true    | false  | column        | date    |                :               :                       :            :
     :               :               | fullname              | Fullname              | false  | true    | true   | calculation   |         :                :               :                       :            :
     | individual    | Subject       | code                  | Code                  | true   | false   | false  | column        | text    |                :               :                       | code       |
     :               :               | sex                   | Sex                   | true   | false   | false  | column        | enum    | not-known      |               :                       :            :
     :               :               :                       :                       :        :         :        :               :         | male           |               :                       :            :
     :               :               :                       :                       :        :         :        :               :         | female         |               :                       :            :
     :               :               :                       :                       :        :         :        :               :         | not-applicable |               :                       :            :
     :               :               | mother                | Mother                | true   | true    | false  | direct-link   |         :                | individual    | individual_via_mother |            :
     :               :               | father                | Father                | true   | true    | false  | direct-link   |         :                | individual    | individual_via_father |            :
     :               :               | identity              | Identity              | false  | true    | false  | indirect-link |         :                | identity      | individual            |            :
     :               :               | individual_via_mother | Individual Via Mother | false  | true    | true   | indirect-link |         :                | individual    | mother                |            :
     :               :               | individual_via_father | Individual Via Father | false  | true    | true   | indirect-link |         :                | individual    | father                |            :
     :               :               | participation         | Participation         | false  | true    | true   | indirect-link |         :                | participation | individual            |            :
     | participation | Participation | individual            | Individual            | true   | false   | false  | direct-link   |         :                | individual    | participation         | individual |
     :               :               | protocol              | Protocol              | true   | false   | false  | direct-link   |         :                | protocol      | participation         | protocol   |
     :               :               | code                  | Code                  | true   | false   | false  | column        | text    |                :               :                       | code       |
     | protocol      | Protocol      | study                 | Study                 | true   | false   | false  | direct-link   |         :                | study         | protocol              | study      |
     :               :               | code                  | Code                  | true   | false   | false  | column        | text    |                :               :                       | code       |
     :               :               | title                 | Title                 | true   | false   | false  | column        | text    |                :               :                       :            :
     :               :               | participation         | Participation         | false  | true    | true   | indirect-link |         :                | participation | protocol              |            :
     | study         | Study         | code                  | Code                  | true   | false   | false  | column        | text    |                :               :                       | code       |
     :               :               | title                 | Title                 | true   | true    | false  | column        | text    |                :               :                       :            :
     :               :               | closed                | Closed                | true   | false   | false  | column        | boolean |                :               :                       :            :
     :               :               | protocol              | Protocol              | false  | true    | true   | indirect-link |         :                | protocol      | study                 |            :


