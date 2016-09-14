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

    >>> req = Request.blank("/query/", remote_user='Alice',
    ...                     POST='{"syntax": ["study"], "format": "x-htsql/json"}')
    >>> print req.get_response(demo)    # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
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


