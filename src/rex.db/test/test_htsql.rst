****************
  HTSQL Plugin
****************

.. contents:: Table of Contents


JSON output
===========

``rex.db`` changes some behavior of HTSQL with a ``rex`` HTSQL plugin.  This
plugin is automatically enabled when the application depends on ``rex.db``::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite')

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


