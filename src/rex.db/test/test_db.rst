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
    While initializing Rex application:
        rex.db_demo

    >>> demo = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite')

Ill-formed and invalid connections URI are rejected immediately::

    >>> Rex('rex.db_demo', db='./sandbox/db_demo.sqlite')
    Traceback (most recent call last):
      ...
    Error: expected a connection URI of the form 'engine://username:password@host:port/database?options'; got './sandbox/db_demo.sqlite'
    While validating setting:
        db
    While initializing Rex application:
        rex.db_demo
    With parameters:
        db: './sandbox/db_demo.sqlite'
    >>> Rex('rex.db_demo', db='sqlite:./sandbox/missing.sqlite')
    Traceback (most recent call last):
      ...
    Error: failed to initialize 'htsql': failed to establish database connection: file does not exist: ./sandbox/missing.sqlite
    While initializing Rex application:
        rex.db_demo
    With parameters:
        db: 'sqlite:./sandbox/missing.sqlite'

Use settings ``htsql_base_extensions`` and ``htsql_extensions`` to enable and
configure HTSQL addons.  The latter overrides the former::

    >>> from rex.db import get_db

    >>> nolimit = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite',
    ...               htsql_base_extensions=None, htsql_extensions=None)
    >>> with nolimit:
    ...     db = get_db()
    ...     print len(db.produce('/department'))
    27

    >>> autolimit5 = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite',
    ...                  htsql_base_extensions={'tweak.autolimit': {'limit': 5}})
    >>> with autolimit5:
    ...     db = get_db()
    ...     print len(db.produce('/department'))
    5

    >>> autolimit2 = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite',
    ...                  htsql_base_extensions={'tweak.autolimit': {'limit': 5}},
    ...                  htsql_extensions={'tweak.autolimit': {'limit': 2}})
    >>> with autolimit2:
    ...     db = get_db()
    ...     print len(db.produce('/department'))
    2

The ``rex`` addon is always enabled, which gives access to Rex-specific domains,
functions and commands::

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

Raw HTSQL service is available under the ``rex.db`` mount point and, by
default, requires authenticated access::

    >>> from webob import Request

    >>> auth_demo = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite',
    ...                 htsql_access='authenticated')

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


Setting ``htsql_access`` controls access to the HTSQL server.  To disable
the service, set ``htsql_access`` to ``None``::

    >>> noservice = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite',
    ...                 htsql_access=None)
    >>> print auth_req.get_response(noservice)  # doctest: +ELLIPSIS
    404 Not Found
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
    Found unknown parameter:
        credit

HTSQL errors are reported back::

    >>> req = Request.blank('/departments_by_avg_credits.htsql?credits=2012-12-31')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS
    400 Bad Request
    ...
    invalid decimal literal: 2012-12-31
    ...


