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
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {}


``$USER``
=========

``rex.db`` passes the name of the authenticated user as ``$USER`` constant::

    >>> req = Request.blank('/db/{$USER}')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | $USER |
    -+-------+-
     |       |

    >>> req = Request.blank('/db/{$USER}', remote_user='Alice')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | $USER |
    -+-------+-
     | Alice |


Masks
=====

You could use the ``Mask`` extension to define a table mask applied to all queries::

    >>> from rex.web import authorize
    >>> from rex.db import Mask

    >>> class MaskSchool(Mask):
    ...     def __call__(self, req):
    ...         if not authorize(req, 'authenticated'):
    ...             return ["school?campus='south'"]
    ...         return []
    >>> demo.reset()

    >>> req = Request.blank('/db/school')
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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
    >>> print req.get_response(demo)            # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
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


