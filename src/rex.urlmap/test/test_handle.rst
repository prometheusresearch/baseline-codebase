***************
  URL Mapping
***************

.. contents:: Table of Contents


Traversing the segment tree
===========================

To find a request handler, ``rex.urlmap`` uses the incoming URL as a path in
the segment tree::

    >>> from rex.core import Rex
    >>> from webob import Request

    >>> demo = Rex('rex.urlmap_demo')

    >>> req = Request.blank('/study')
    >>> req.remote_user = 'Alice'
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>Studies</title>
    ...

The segment tree may contain wildcard branches::

    >>> req = Request.blank('/study/asdl')
    >>> req.remote_user = 'Alice'
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>Study: asdl</title>
    ...

Unrecognized URLs are rejected::

    >>> req = Request.blank('/enrollment')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    404 Not Found
    ...

Or delegated to the next handler in the routing pipeline::

    >>> fallback = Rex('rex.urlmap_demo', './test/data/fallback/',
    ...                mount={'fallback': '/'})
    >>> req = Request.blank('/fallback.html')
    >>> print req.get_response(fallback)    # doctest: +ELLIPSIS
    200 OK
    ...
    <!DOCTYPE html>
    <title>Fallback page</title>


Access control
==============

Access permissions could be specified for each URL::

    >>> from rex.core import SandboxPackage
    >>> sandbox = SandboxPackage()

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /public:
    ...     template: templates:/template/universal.html
    ...     access: anybody
    ...     context: { title: Public access! }
    ...   /private:
    ...     template: templates:/template/universal.html
    ...     context: { title: For authenticated users only! }
    ...   /unsafe:
    ...     template: templates:/template/universal.html
    ...     access: anybody
    ...     unsafe: true
    ...     context: { title: Protected against CSRF attacks! }
    ... """)

    >>> auth_demo = Rex(sandbox, './test/data/templates/', 'rex.urlmap_demo')

URLs with ``access`` parameter set to ``anybody`` do not require
authorization::

    >>> req = Request.blank('/public')
    >>> print req.get_response(auth_demo)   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>Public access!</title>
    ...

By default, only authenticated users are accepted::

    >>> req = Request.blank('/private')
    >>> print req.get_response(auth_demo)   # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req.remote_user = 'Alice'
    >>> print req.get_response(auth_demo)   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>For authenticated users only!</title>
    ...

Pages marked as ``unsafe`` require a CSRF token::

    >>> req = Request.blank('/unsafe')
    >>> print req.get_response(auth_demo)   # doctest: +ELLIPSIS
    403 Forbidden
    ...

    >>> import re
    >>> req = Request.blank('/public')
    >>> resp = req.get_response(auth_demo)
    >>> session_cookie = resp.headers['Set-Cookie'].split('=')[1].split(';')[0]
    >>> csrf_token = re.search('<meta name="_csrf_token" content="([^"]*)">', str(resp)).group(1)

    >>> req = Request.blank('/unsafe')
    >>> req.cookies['rex.session'] = session_cookie
    >>> req.headers['X-CSRF-Token'] = csrf_token
    >>> print req.get_response(auth_demo)   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>Protected against CSRF attacks!</title>
    ...


Ports and access control
========================

Ports generate HTSQL output::

    >>> req = Request.blank('/data/total', accept='application/json')
    >>> print req.get_response(demo)    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "total_study": 2,
      "total_individual": 5
    }

Errors in query parameters are detected::

    >>> req = Request.blank('/data/study?individual=1000', accept='application/json',
    ...                     remote_user='Alice')
    >>> print req.get_response(demo)    # doctest: +ELLIPSIS
    400 Bad Request
    ...

Access permissions for port handlers work the same way as for template
handlers::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /data/public:
    ...     port: num_study := count(study?!closed)
    ...     access: anybody
    ...   /data/private:
    ...     port: study?!closed
    ...   /data/unsafe:
    ...     port: individual
    ...     access: anybody
    ...     unsafe: true
    ...   /csrf-token:
    ...     template: templates:/template/universal.html
    ...     access: anybody
    ...     context: { title: Get a CSRF token from this page }
    ... """)

    >>> data_auth_demo = Rex(sandbox, './test/data/templates/', 'rex.urlmap_demo')

Again, URLs with ``access`` parameter set to ``anybody`` do not require
authorization::

    >>> req = Request.blank('/data/public', accept='application/json')
    >>> print req.get_response(data_auth_demo)  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "num_study": 2
    }

By default, only authenticated users are accepted::

    >>> req = Request.blank('/data/private', accept='application/json')
    >>> print req.get_response(data_auth_demo)  # doctest: +ELLIPSIS
    401 Unauthorized
    ...

    >>> req.remote_user = 'Alice'
    >>> print req.get_response(data_auth_demo)  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "study": [
        {
          "id": "asdl",
          "code": "asdl",
          "title": "Autism Spectrum Disorder Lab",
          "closed": false
        },
        ...
      ]
    }

Ports marked as ``unsafe`` require a CSRF token::

    >>> req = Request.blank('/data/unsafe', accept='application/json')
    >>> print req.get_response(data_auth_demo)  # doctest: +ELLIPSIS
    403 Forbidden
    ...

    >>> import re
    >>> req = Request.blank('/csrf-token')
    >>> resp = req.get_response(data_auth_demo)
    >>> session_cookie = resp.headers['Set-Cookie'].split('=')[1].split(';')[0]
    >>> csrf_token = re.search('<meta name="_csrf_token" content="([^"]*)">', str(resp)).group(1)

    >>> req = Request.blank('/data/unsafe', accept='application/json')
    >>> req.cookies['rex.session'] = session_cookie
    >>> req.headers['X-CSRF-Token'] = csrf_token
    >>> print req.get_response(data_auth_demo)  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "individual": [
        {
          "id": "1000",
          "code": "1000",
          "first_name": "May",
          "last_name": "Kanaris",
          "sex": "female"
        },
        ...
      ]
    }


Parameters
==========

URLs can possess segment and query parameters::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /segment/$segment:
    ...     template: templates:/template/universal.html
    ...     access: anybody
    ...   /parameter:
    ...     template: templates:/template/universal.html
    ...     access: anybody
    ...     parameters: { parameter }
    ... """)
    >>> params_demo = Rex(sandbox, './test/data/templates/', 'rex.urlmap_demo')

Segment and parameter values are passed to the template::

    >>> req = Request.blank('/segment/test')
    >>> print req.get_response(params_demo) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <p>Segment label is <code>test</code></p>
    ...

    >>> req = Request.blank('/parameter?parameter=test')
    >>> print req.get_response(params_demo) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <p>Parameter value is <code>test</code></p>
    ...

Unknown or duplicate parameters are rejected::

    >>> req = Request.blank('/parameter?argument=test')
    >>> print req.get_response(params_demo) # doctest: +ELLIPSIS
    400 Bad Request
    ...
    Received unexpected parameter:
        argument

    >>> req = Request.blank('/parameter?parameter=test&parameter=test')
    >>> print req.get_response(params_demo) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...
    Got multiple values for parameter:
        parameter


