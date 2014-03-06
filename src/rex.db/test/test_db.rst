*******************
  Database Access
*******************

.. contents:: Table of Contents


Connecting to the database
==========================

HTSQL connection URI is a mandatory setting::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.db_demo')
    Traceback (most recent call last):
      ...
    Error: Missing mandatory setting:
        db
    While initializing RexDB application:
        rex.db_demo

    >>> demo = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite')

Ill-formed and invalid connections URI are rejected immediately::

    >>> Rex('rex.db_demo', db='./sandbox/db_demo.sqlite')
    Traceback (most recent call last):
      ...
    Error: expected a connection URI of the form 'engine://username:password@host:port/database?options'; got './sandbox/db_demo.sqlite'
    While validating setting:
        db
    While initializing RexDB application:
        rex.db_demo
    With parameters:
        db: './sandbox/db_demo.sqlite'
    >>> Rex('rex.db_demo', db='sqlite:./sandbox/missing.sqlite')
    Traceback (most recent call last):
      ...
    Error: failed to initialize 'htsql': failed to establish database connection: file does not exist: ./sandbox/missing.sqlite
    While initializing RexDB application:
        rex.db_demo
    With parameters:
        db: 'sqlite:./sandbox/missing.sqlite'

Use setting ``htsql_extensions`` to enable and configure HTSQL addons.
Settings specified in different packages are merged together::

    >>> from rex.db import get_db

    >>> nolimit = Rex('rex.db_demo',
    ...               db='sqlite:./sandbox/db_demo.sqlite',
    ...               htsql_extensions=None)
    >>> with nolimit:
    ...     db = get_db()
    ...     print len(db.produce('/department'))
    27

    >>> autolimit5 = Rex('rex.db_demo', './test/data/autolimit5/',
    ...                  db='sqlite:./sandbox/db_demo.sqlite',
    ...                  htsql_extensions=None)
    >>> with autolimit5:
    ...     db = get_db()
    ...     print len(db.produce('/department'))
    5

    >>> autolimit2 = Rex('rex.db_demo', './test/data/autolimit5/',
    ...                  db='sqlite:./sandbox/db_demo.sqlite',
    ...                  htsql_extensions={'tweak.autolimit': {'limit': 2}})
    >>> with autolimit2:
    ...     db = get_db()
    ...     print len(db.produce('/department'))
    2

The ``rex`` addon is always enabled, which gives access to RexDB-specific
domains, functions and commands::

    >>> with demo:
    ...     db = get_db()

    >>> product = db.produce('/department/:describe')
    >>> product
    <Product null>
    >>> product.meta
    <Profile list(record(text, text, text))>

    >>> db.produce('/describe()')
    Traceback (most recent call last):
      ...
    Error: Expected one argument
    While parsing:
        /describe()
         ^^^^^^^^^^


HTSQL service
=============

Raw HTSQL service is available under the ``rex.db`` mount point and requires
the ``rex.db`` package permissions::

    >>> from webob import Request

    >>> auth_demo = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite',
    ...                 access={'rex.db': 'authenticated'})

    >>> anon_req = Request.blank('/db/department')
    >>> print anon_req.get_response(auth_demo)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> auth_req = Request.blank('/db/department')
    >>> auth_req.remote_user = 'Alice'
    >>> print auth_req.get_response(auth_demo)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    ...
     | department                                    |
     +--------+------------------------+-------------+
     | code   | name                   | school_code |
    -+--------+------------------------+-------------+-
     | acc    | Accounting             | bus         |
     | arthis | Art History            | la          |
     | astro  | Astronomy              | ns          |
    ...

It is possible to tunnel HTSQL queries in a POST body::

    >>> req = Request.blank('/db/', POST="/department")
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    ...
     | department                                    |
     +--------+------------------------+-------------+
     | code   | name                   | school_code |
    -+--------+------------------------+-------------+-
     | acc    | Accounting             | bus         |
     | arthis | Art History            | la          |
     | astro  | Astronomy              | ns          |
    ...

When the query is in a POST body, special characters must be properly escaped::

    >>> req = Request.blank('/db/', POST="/department%7Bcode,name%7D?school.code=%27ns%27")
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    ...
     | department          |
     +-------+-------------+
     | code  | name        |
    -+-------+-------------+-
     | astro | Astronomy   |
     | chem  | Chemistry   |
     | mth   | Mathematics |
     ...

The permission on ``rex.db`` package controls access to the HTSQL server.  To disable
the service, set the permission to ``nobody``::

    >>> noservice = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite',
    ...                 access={'rex.db': 'nobody'})
    >>> print auth_req.get_response(noservice)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...


``*.htsql`` files
=================

You can keep "prepared" HTSQL queries in ``*.htsql`` files::

    >>> req = Request.blank('/departments_by_avg_credits.htsql?credits=3.5')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    ...
     | department                                        |
     +--------+-------------------+----------------------+
     | code   | name              | round(avg_credits,2) |
    -+--------+-------------------+----------------------+-
     | econ   | Economics         |                 3.53 |
     | eng    | English           |                 3.52 |
     | lang   | Foreign Languages |                 3.57 |
     ...

If a parameter is not supplied, the default value is used::

    >>> req = Request.blank('/departments_by_avg_credits.htsql')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    200 OK
    ...
     | department                                             |
     +--------+------------------------+----------------------+
     | code   | name                   | round(avg_credits,2) |
    -+--------+------------------------+----------------------+-
     | acc    | Accounting             |                  3.5 |
     | arthis | Art History            |                  3.5 |
     | astro  | Astronomy              |                  3.0 |
    ...


Unexpected parameters are rejected::

    >>> req = Request.blank('/departments_by_avg_credits.htsql?credit=1')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    400 Bad Request
    ...
    Received unexpected parameter:
        credit

HTSQL errors are reported back::

    >>> req = Request.blank('/departments_by_avg_credits.htsql?credits=2012-12-31')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    400 Bad Request
    ...
    invalid decimal literal: 2012-12-31
    ...


``Query``
=========

The ``Query`` class wraps ``.htsql`` files and HTSQL queries::

    >>> from rex.db import Query
    >>> with demo:
    ...     query = Query("rex.db_demo:/www/departments_by_school.htsql")
    >>> print query
    Query('rex.db_demo:/www/departments_by_school.htsql')

Use method ``produce()`` to execute the query::

    >>> with demo:
    ...     print query.produce(school='ns')        # doctest: +ELLIPSIS
    ({'astro', 'Astronomy'}, {'chem', 'Chemistry'}, ...)


Use method ``format()`` to execute the query and render the result using HTSQL
formatter::

    >>> with demo:
    ...     print query.format("application/json", school='ns')     # doctest: +ELLIPSIS
    {
      "department": [
        {
          "code": "astro",
          "name": "Astronomy"
        },
        {
          "code": "chem",
          "name": "Chemistry"
        },
        ...
      ]
    }
    <BLANKLINE>


``Query`` can also takes query parameters and formatting options from a
``Request`` object and produce a ``Response`` object::

    >>> req = Request.blank('/?school=ns')
    >>> req.accept = 'x-htsql/raw'
    >>> with demo:
    ...     print query(req)                        # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/javascript
    ...
    {
      "meta": {
        ...
      },
      "data": [
        [
          "astro",
          "Astronomy"
        ],
        [
          "chem",
          "Chemistry"
        ],
        ...
      ]
    }
    <BLANKLINE>


