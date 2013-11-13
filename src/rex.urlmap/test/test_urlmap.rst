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


Parsing ``urlmap.yaml``
=======================

``rex.urlmap`` detects duplicate or ambiguous paths::

    >>> from rex.core import SandboxPackage
    >>> sandbox = SandboxPackage()

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /$a: { template: . }
    ...   /$b: { template: . }
    ... """)
    >>> Rex(sandbox, 'rex.urlmap')          # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Detected duplicate or ambiguous path:
        /$b
    Defined in:
        "/.../urlmap.yaml", line 4
    And previously in:
        "/.../urlmap.yaml", line 3
    ...

``rex.urlmap`` understands both full package and local package paths::

    >>> sandbox.rewrite('/template/full.html',
    ...                 """<title>sandbox:/template/full.html</title>""")
    >>> sandbox.rewrite('/template/local.html',
    ...                 """<title>/template/local.html</title>""")
    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /full:
    ...     template: sandbox:/template/full.html
    ...     access: anybody
    ...   /local:
    ...     template: /template/local.html
    ...     access: anybody
    ... """)

    >>> path_demo = Rex(sandbox, 'rex.urlmap')

    >>> req = Request.blank('/full')
    >>> print req.get_response(path_demo)   # doctest: +ELLIPSIS
    200 OK
    ...
    <title>sandbox:/template/full.html</title>

    >>> req = Request.blank('/local')
    >>> print req.get_response(path_demo)   # doctest: +ELLIPSIS
    200 OK
    ...
    <title>/template/local.html</title>

You can use ``include`` directive to split the ``urlmap.yaml``
into several files::

    >>> sandbox.rewrite('/urlmap/study.yaml', """
    ... paths:
    ...   /study:
    ...     template: templates:/template/universal.html
    ...     context: { title: Studies }
    ... """)
    >>> sandbox.rewrite('/urlmap/individual.yaml', """
    ... paths:
    ...   /individual:
    ...     template: templates:/template/universal.html
    ...     context: { title: Individuals }
    ... """)
    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: [./urlmap/study.yaml, ./urlmap/individual.yaml]
    ... """)

    >>> include_demo = Rex(sandbox, 'rex.urlmap')

``include`` directive can also take a single filename.  Full package paths are
accepted::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: sandbox:./urlmap/study.yaml
    ... """)

    >>> include_demo = Rex(sandbox, 'rex.urlmap')


Access control
==============

Access permissions could be specified for each URL::

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

    >>> auth_demo = Rex(sandbox, './test/data/templates/', 'rex.urlmap')

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
    >>> params_demo = Rex(sandbox, './test/data/templates/', 'rex.urlmap')

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


