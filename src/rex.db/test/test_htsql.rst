****************
  HTSQL Plugin
****************

.. contents:: Table of Contents


JSON output
===========

``rex.db`` changes some behavior of HTSQL with a ``rex`` HTSQL plugin.  This
plugin is automatically enabled when the application depends on ``rex.db``::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.db_demo', '-', db='sqlite:./sandbox/db_demo.sqlite')

By default, HTSQL strips ``NULL`` values from JSON output.  The ``rex``
plugin disables this feature::

    >>> from webob import Request

    >>> req = Request.blank('/db/{field:=integer(null)}', accept='application/json')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "0": [
        {
          "field": null
        }
      ]
    }

    >>> req = Request.blank('/db/{field:=integer(null)}/:json')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "0": [
        {
          "field": null
        }
      ]
    }

By default, HTSQL wraps JSON output in an extra mapping.  The ``rex``
plugin prevents it in case the top-level object is a record::

    >>> req = Request.blank('/db/json({})')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {}


``$USER``
=========

``rex.db`` passes the name of the authenticated user as ``$USER`` constant::

    >>> req = Request.blank('/db/{$USER}')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | $USER |
    -+-------+-
     |       |

    >>> req = Request.blank('/db/{$USER}', remote_user='Alice')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | $USER |
    -+-------+-
     | Alice |


Masks
=====

You could use the ``Mask`` extension to define a table mask applied to all queries::

    >>> from rex.web import authenticate, authorize
    >>> from rex.db import Mask

    >>> class MaskSchool(Mask):
    ...     def __call__(self, req):
    ...         if not authorize(req, 'authenticated'):
    ...             return ["school?campus='south'"]
    ...         user = authenticate(req)
    ...         if user == 'Bad Syntax':
    ...             return ["!school"]
    ...         if user == 'Bad Table':
    ...             return ["individual?sex='male'"]
    ...         return []
    >>> demo.reset()

    >>> req = Request.blank('/db/school')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | school                                  |
     +------+-------------------------+--------+
     | code | name                    | campus |
    -+------+-------------------------+--------+-
     | bus  | School of Business      | south  |
     | mus  | School of Music & Dance | south  |

The way we defined the mask, it is bypassed by authenticated users::

    >>> req.remote_user = 'Alice'
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | school                                        |
     +------+-------------------------------+--------+
     | code | name                          | campus |
    -+------+-------------------------------+--------+-
     | art  | School of Art & Design        | old    |
    ...

The mask is also applied to descendant tables of the mask table::

    >>> req = Request.blank('/db/program{school{name}, title}')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | program                                            |
     +--------------------+-------------------------------+
     | school             |                               |
     +--------------------+                               |
     | name               | title                         |
    -+--------------------+-------------------------------+-
     | School of Business | Master of Arts in Economics   |
     ...
     | School of Business | Bachelor of Arts in Economics |

Masks are also applied to regular links::

    >>> req = Request.blank('/db/department{name, school{name, count(program)}}')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     +------------------------+------------------------------------------+
     |                        | school                                   |
     |                        +-------------------------+----------------+
     | name                   | name                    | count(program) |
    -+------------------------+-------------------------+----------------+-
     | Accounting             | School of Business      |              6 |
     | Art History            |                         :                :
     | Astronomy              |                         :                :
    ...

    >>> req = Request.blank('/db/program{id(), part_of{id()}}')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | program                |
     +------------+-----------+
     |            | part_of   |
     |            +-----------+
     | id()       | id()      |
    -+------------+-----------+-
     | bus.gecon  |           :
    ...
     | bus.uecon  | bus.gecon |

Invalid masks are detected::

    >>> req = Request.blank('/db/school', remote_user='Bad Syntax')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS
    400 Bad Request
    ...
    Expected a mask expression:
        !school
    ...

    >>> req = Request.blank('/db/school', remote_user='Bad Table')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS
    400 Bad Request
    ...
    Got unknown table:
        individual?sex='male'
    ...


``describe()``
==============

To determine the shape of the output, you can use the ``describe()`` command::

    >>> req = Request.blank('/db/school/:describe', accept='x-htsql/raw')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "meta": {
        "domain": {
          "type": "list",
          "item": {
            "domain": {
              "type": "record",
              ...
            }
          }
        },
        ...
      }
    }

The ``describe()`` command requires one argument::

    >>> req = Request.blank('/db/describe()')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Expected one argument
    While parsing:
        /describe()
         ^^^^^^^^^^


``pivot()``
===========

Use ``pivot()`` command to create a pivot table::

    >>> req = Request.blank('/db/school^campus{campus, count(^)}/:pivot', remote_user='Alice')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | school^campus       |
     +---------------------+
     | campus              |
     +-------+-----+-------+
     | north | old | south |
    -+-------+-----+-------+-
     |     1 |   4 |     2 |

By default, ``pivot()`` command uses the last two fields as the column label and a
summary value respectively.  You can explicitly specify which fields to use::

    >>> req = Request.blank('/db/school^campus{campus, count(^)}/:pivot(1,2)', remote_user='Alice')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | school^campus       |
     +---------------------+
     | campus              |
     +-------+-----+-------+
     | north | old | south |
    -+-------+-----+-------+-
     |     1 |   4 |     2 |

Out of range or non-numeric indexes are forbidden::

    >>> req = Request.blank('/db/school^campus{campus, count(^)}/:pivot(5)')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    'on' is out of range:
        5
    While processing:
        /school^campus{campus, count(^)}/:pivot(5)
                                          ^^^^^

    >>> req = Request.blank('/db/school^campus{campus, count(^)}/:pivot(1,5)')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    'by' is out of range:
        5
    While processing:
        /school^campus{campus, count(^)}/:pivot(1,5)
                                          ^^^^^

    >>> req = Request.blank('/db/school^campus{campus, count(^)}/:pivot(1,1)')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    'on' and 'by' should not coincide:
        1
    While processing:
        /school^campus{campus, count(^)}/:pivot(1,1)
                                          ^^^^^

    >>> req = Request.blank('/db/school^campus{campus, count(^)}/:pivot(code)')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Expected an integer:
        code
    While parsing:
        /school^campus{campus, count(^)}/:pivot(code)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    >>> req = Request.blank('/db/school^campus{campus, count(^)}/:pivot(1,code)')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Expected an integer:
        code
    While parsing:
        /school^campus{campus, count(^)}/:pivot(1,code)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

From one to three arguments are expected::

    >>> req = Request.blank('/db/pivot()')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Expected 1 to 3 arguments
    While parsing:
        /pivot()
         ^^^^^^^

The query must produce a list of records and the transformed fields must be
scalar::

    >>> req = Request.blank('/db/pivot(count(school))')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Expected a list of records; got:
        integer
    While processing:
        /pivot(count(school))
         ^^^^^

    >>> req = Request.blank('/db/school^campus{/school,campus,count(school)}/:pivot')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Cannot use pivot with:
        record(list(record(text, text, text)), text, integer)
    While processing:
        /school^campus{/school,campus,count(school)}/:pivot
                                                      ^^^^^

Unaffected fields must identify a row uniquely::

    >>> req = Request.blank('/db/school{campus,count(program)}/:pivot', remote_user='Alice')
    >>> print(req.get_response(demo))            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Got duplicate row:
        {'old', 7}
    While processing:
        /school{campus,count(program)}/:pivot
                                        ^^^^^


Connection passthrough
======================

You can pass a database connection from one HTSQL application to another using
the ``connection`` parameter of the ``rex`` addon.

You start with acquiring a database connection::

    >>> from rex.db import get_db
    >>> with demo:
    ...    db = get_db()

    >>> connection = db.connect()

Next, we create a new HTSQL instance::

    >>> from rex.db import RexHTSQL

    >>> db_connected = RexHTSQL('sqlite:-', {'rex': {'connection': connection}})

Then, you can run queries against the connected instance, which should be
done in a transaction context of the parent instance::

    >>> with db, db.transaction():
    ...     with db_connected:
    ...         print(db_connected.produce('count(program)'))
    40



