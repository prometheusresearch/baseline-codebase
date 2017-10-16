********************
  HTTP Entry Point
********************

.. contents:: Table of Contents


Using ``rex.query`` Entry Point
===============================

``rex.query`` provides an HTTP interface to the application database.
To enable it, we need to configure access control to the entry point::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.query_demo', access={'rex.query': 'authenticated'})
    >>> demo.on()

We can now submit HTTP requests to ``rex.query``::

    >>> from webob import Request

    >>> req = Request.blank("/query/query/", remote_user='Alice',
    ...                     POST='{"syntax": ["nation"], "format": "x-htsql/json"}')
    >>> print req.get_response(demo)    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    ...
    {
      "nation": [
        {
          "name": "ALGERIA",
          "region": "AFRICA",
          "comment": " haggle. carefully final deposits detect slyly agai"
        },
        ...
      ]
    }

We can also submit the query without executing it in order to receive the query
metadata::

    >>> req = Request.blank("/query/query/?dry-run", remote_user='Alice',
    ...                     POST='{"syntax": ["nation"], "format": "x-htsql/raw"}')
    >>> print req.get_response(demo)    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    ...
    {
      "meta": {
        "domain": {
          ...
        },
        "header": "Nation",
        "path": "nation",
        "syntax": "\/nation",
        "tag": "nation"
      }
    }

