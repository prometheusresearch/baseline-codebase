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
    rex.core.Error: Missing mandatory setting:
        db
    While initializing RexDB application:
        rex.db_demo

    >>> demo = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite')

Ill-formed and invalid connections URI are rejected immediately::

    >>> Rex('rex.db_demo', db='./sandbox/db_demo.sqlite')
    Traceback (most recent call last):
      ...
    rex.core.Error: expected a connection URI of the form 'engine://username:password@host:port/database?options'; got './sandbox/db_demo.sqlite'
    While validating setting:
        db
    While initializing RexDB application:
        rex.db_demo
    With parameters:
        db: './sandbox/db_demo.sqlite'
    >>> Rex('rex.db_demo', db='sqlite:./sandbox/missing.sqlite')
    Traceback (most recent call last):
      ...
    rex.core.Error: failed to initialize 'htsql': failed to establish database connection: file does not exist: ./sandbox/missing.sqlite
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
    ...     print(len(db.produce('/department')))
    27

    >>> autolimit5 = Rex('rex.db_demo', './test/data/autolimit5/',
    ...                  db='sqlite:./sandbox/db_demo.sqlite',
    ...                  htsql_extensions=None)
    >>> with autolimit5:
    ...     db = get_db()
    ...     print(len(db.produce('/department')))
    5

    >>> autolimit2 = Rex('rex.db_demo', './test/data/autolimit5/',
    ...                  db='sqlite:./sandbox/db_demo.sqlite',
    ...                  htsql_extensions={'tweak.autolimit': {'limit': 2}})
    >>> with autolimit2:
    ...     db = get_db()
    ...     print(len(db.produce('/department')))
    2


Gateways
========

In addition to the main application database, you can configure secondary
databases called *gateways*.  For example, you can create a gateway to
a set of CSV files::

    >>> gateway = Rex('rex.db_demo', './test/data/gateway/',
    ...               db='sqlite:./sandbox/db_demo.sqlite')

The data can be accessed through the main database using the gateway
function::

    >>> with gateway:
    ...     db = get_db()
    ...     print(db.produce('gateway(count(instructor))'))
    123

Alternatively, you could get an HTSQL instance for the gateway database::

    >>> with gateway:
    ...     gateway_db = get_db('gateway')
    ...     print(gateway_db.produce('count(instructor)'))
    123

If the gateway is configured in several places, the configuration is merged::

    >>> autolimit_gateway = Rex('rex.db_demo', './test/data/gateway/',
    ...                         db='sqlite:./sandbox/db_demo.sqlite',
    ...                         gateways={'gateway': {'tweak.autolimit': {'limit': 5}}})
    >>> with autolimit_gateway:
    ...     gateway_db = get_db('gateway')
    ...     print(len(gateway_db.produce('/instructor')))
    5

You could disable a gateway by setting the gateway parameters to ``None``::

    >>> no_gateway = Rex('rex.db_demo', './test/data/gateway/',
    ...                  db='sqlite:./sandbox/db_demo.sqlite',
    ...                  gateways={'gateway': None})

    >>> with no_gateway:
    ...     no_db = get_db('gateway')
    Traceback (most recent call last):
      ...
    KeyError: 'gateway'


Querying the database
=====================

You can use the method ``produce()`` to query the database::

    >>> with demo:
    ...     db = get_db()

    >>> db.produce('/school')           # doctest: +ELLIPSIS
    <Product ({'art', 'School of Art & Design', 'old'}, ...>

Method ``produce()`` also admits file streams::

    >>> import io
    >>> input = io.StringIO('/school')
    >>> db.produce(input)               # doctest: +ELLIPSIS
    <Product ({'art', 'School of Art & Design', 'old'}, ...>

The input may contain more than one query.  The output of the last
query is returned::

    >>> input = io.StringIO('/school\n\n/department\n\n')
    >>> db.produce(input)               # doctest: +ELLIPSIS
    <Product ({'acc', 'Accounting', 'bus'}, ...>

Comments are denoted by ``#`` starting at the beginning of the line::

    >>> input = io.StringIO('# Get all schools\n/school\n\n# Get all departments\n/department\n')
    >>> db.produce(input)               # doctest: +ELLIPSIS
    <Product ({'acc', 'Accounting', 'bus'}, ...>

If the query spans multiple lines, all lines but the first one must be indented
with at least one space::

    >>> input = io.StringIO('/school{\n code,\n name}\n')
    >>> db.produce(input)               # doctest: +ELLIPSIS
    <Product ({'art', 'School of Art & Design'}, ...>

Invalid indentation is reported::

    >>> input = io.StringIO(' /school ')
    >>> db.produce(input)               # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    htsql.core.error.Error: Got unexpected indentation:
        <input>, line 1

When an error occurs, the file name and the line of the query are reported::

    >>> input = io.StringIO('/class')
    >>> db.produce(input)               # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    htsql.core.error.Error: Found unknown attribute:
        class
    While translating:
        /class
         ^^^^^
    While executing:
        <input>, line 1

The input may contain no queries::

    >>> db.produce(io.StringIO())

The result can be rendered in different formats::

    >>> product = db.produce('/school')
    >>> format = db.accept('csv')
    >>> db.emit_headers(format, product)    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    [('Content-Type', 'text/csv; charset=UTF-8'),
     ('Content-Disposition', 'attachment; filename="school.csv"')]
    >>> list(db.emit(format, product))      # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    [b'code,name,campus\r\n',
     b'art,School of Art & Design,old\r\n',
     ...]

If necessary, you can get a raw SQL connection to the database and execute SQL
queries::

    >>> with db:
    ...     connection = db.connect()
    ...     cursor = connection.cursor()
    ...     cursor.execute("""SELECT abs(-1)""").fetchall()
    [(1,)]


HTSQL service
=============

Raw HTSQL service is available under the ``rex.db`` mount point and requires
the ``rex.db`` package permissions. By default, it does not allow any access::

    >>> from webob import Request

    >>> auth_demo = Rex('rex.db', db='sqlite:./sandbox/db_demo.sqlite')

    >>> req = Request.blank('/db/department')
    >>> req.remote_user = 'Alice'
    >>> print(req.get_response(auth_demo))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

    >>> auth_demo = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite',
    ...                 access={'rex.db': 'authenticated'})

    >>> anon_req = Request.blank('/db/department')
    >>> print(anon_req.get_response(auth_demo))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

    >>> auth_req = Request.blank('/db/department')
    >>> auth_req.remote_user = 'Alice'
    >>> print(auth_req.get_response(auth_demo))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print(auth_req.get_response(noservice))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

The HTSQL service also provides access to the gateway databases::

    >>> req = Request.blank('/db/@gateway/instructor')
    >>> print(req.get_response(gateway))         # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | instructor                                                                  |
     +------------+-------+--------------------+----------+------------------------+
     | code       | title | full_name          | phone    | email                  |
    -+------------+-------+--------------------+----------+------------------------+-
     | alott      | ms    | Ann Lott           | 856-7634 | alott@example.com      |
     | amarcum    | dr    | Allen Marcum       | 140-1768 | amarcum@example.com    |
     | aphelps    | prof  | Ann Phelps         | 455-3127 | aphelps@example.com    |
    ...

A gateway URL without trailing ``/`` causes redirection::

    >>> req = Request.blank('/db/@gateway')
    >>> print(req.get_response(gateway))         # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    301 Moved Permanently
    Location: http://localhost/db/@gateway/
    ...

Unknown gateways are rejected::

    >>> req = Request.blank('/db/@unknown/')
    >>> print(req.get_response(gateway))         # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...


``*.htsql`` files
=================

You can keep "prepared" HTSQL queries in ``*.htsql`` files::

    >>> req = Request.blank('/departments_by_avg_credits.htsql?credits=3.5')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Received unexpected parameter:
        credit

HTSQL errors are reported back::

    >>> req = Request.blank('/departments_by_avg_credits.htsql?credits=2012-12-31')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print(query)
    Query('rex.db_demo:/www/departments_by_school.htsql')

Use method ``produce()`` to execute the query::

    >>> with demo:
    ...     print(query.produce(school='ns'))        # doctest: +ELLIPSIS
    ({'astro', 'Astronomy'}, {'chem', 'Chemistry'}, ...)


Use method ``format()`` to execute the query and render the result using HTSQL
formatter::

    >>> with demo:
    ...     print(query.format("application/json", school='ns').decode('utf-8'))    # doctest: +ELLIPSIS
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
    ...     print(query(req))                        # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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

We can also initialize ``Query`` with HTSQL passed as an argument::

    >>> with demo:
    ...     print(Query('count(instructor)').produce())
    0

Query can be parametrized::

    >>> with demo:
    ...     print(Query('2+2=$result').produce({'result': 4}))
    true

We can pass parameters default values as keyword argument::

    >>> with demo:
    ...     print(Query('2+2=$result', parameters={'result': 4}).produce())
    true

    >>> with demo:
    ...     print(Query('2+2=$result', parameters={'result': 4}).produce(result=5))
    false

``Query`` object can be used to query data from a specific gateway::

    >>> gateway = Rex('rex.db_demo', './test/data/gateway/',
    ...               db='sqlite:./sandbox/db_demo.sqlite')

We can refer to gateway by its name::

    >>> with gateway:
    ...     print(Query('count(instructor)', db='gateway').produce())
    123

    >>> req = Request.blank('/', accept='application/json')
    >>> with gateway:
    ...     print(Query('count(instructor)', db='gateway')(req)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/javascript
    Content-Disposition: inline; filename="count(instructor).js"
    Vary: Accept
    Content-Length: ...
    <BLANKLINE>
    {
      "0": 123
    }
    <BLANKLINE>

    >>> with gateway:
    ...     print(Query('count(instructor)', db='gateway').format('json').decode('utf-8'))
    {
      "0": 123
    }
    <BLANKLINE>

Or pass a HTSQL instance itself::

    >>> with gateway:
    ...     print(Query('count(instructor)', db=get_db('gateway')).produce())
    123

    >>> req = Request.blank('/', accept='application/json')
    >>> with gateway:
    ...     print(Query('count(instructor)', db=get_db('gateway'))(req)) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/javascript
    Content-Disposition: inline; filename="count(instructor).js"
    Vary: Accept
    Content-Length: ...
    <BLANKLINE>
    {
      "0": 123
    }
    <BLANKLINE>

    >>> with gateway:
    ...     print(Query('count(instructor)', db=get_db('gateway')).format('json').decode('utf-8'))
    {
      "0": 123
    }
    <BLANKLINE>

