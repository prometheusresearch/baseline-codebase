************************************
  Authentication and Authorization
************************************

.. contents:: Table of Contents


Authentication
==============

You can use ``user_query`` parameter to configure a query that checks
whether the user is authenticated with the application.

Let us define a protected resource::

    >>> from rex.web import Command, authenticate
    >>> from webob import Request, Response

    >>> class ProtectedCmd(Command):
    ...     path = '/protected'
    ...     def render(self, req):
    ...         return Response("Hello, %s!" % authenticate(req), content_type='text/plain')

Now configure the application so that it knows some users, but not the others::

    >>> from rex.core import Rex

    >>> nonobody = Rex('__main__', 'rex.db',
    ...     db="sqlite:./sandbox/db_demo.sqlite",
    ...     user_query="$USER!='Nobody'")

Let us verify that authentication works as expected::

    >>> req = Request.blank('/protected', remote_user="Alice")
    >>> print(req.get_response(nonobody))        # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    Hello, Alice!


    >>> req.remote_user = "Nobody"
    >>> print(req.get_response(nonobody))        # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...

In addition, parameter ``auto_user_query`` allows you to manage
guest accounts::

    >>> guest = Rex('__main__', 'rex.db',
    ...     db="sqlite:./sandbox/db_demo.sqlite",
    ...     user_query="$USER!='Nobody'",
    ...     auto_user_query="'Guest'")

    >>> req = Request.blank('/protected', remote_user="Alice")
    >>> print(req.get_response(guest))           # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    Hello, Alice!

    >>> req.remote_user = "Nobody"
    >>> print(req.get_response(guest))           # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    Hello, Guest!


Authorization
=============

Parameter ``access_queries`` lets you configure queries to verify access
permissions.

Let us define a resource with a special permission::

    >>> class SpecialCmd(Command):
    ...     path = '/special'
    ...     access = 'special'
    ...     def render(self, req):
    ...         return Response("Hello, %s!" % authenticate(req), content_type='text/plain')

Now let us configure ``access_queries``::

    >>> special = Rex('__main__', 'rex.db',
    ...     db="sqlite:./sandbox/db_demo.sqlite",
    ...     access_queries={'special': "$USER='Alice'"})

We can verify that permission checking works::

    >>> req = Request.blank('/special', remote_user="Alice")
    >>> print(req.get_response(special))         # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    Hello, Alice!

    >>> req.remote_user = "Bob"
    >>> print(req.get_response(special))         # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...


Masking
=======

Finally, parameter ``access_masks`` configure masks for each specific
permission.

Let us configure a mask for the HTSQL entry point::

    >>> north = Rex('__main__', 'rex.db',
    ...     db="sqlite:./sandbox/db_demo.sqlite",
    ...     access={'rex.db': 'north'},
    ...     access_queries={'north': "true"},
    ...     access_masks={'north': "school?campus='north'"})

Now let us verify that the mask is applied::

    >>> req = Request.blank('/db/school', remote_user="Alice")
    >>> print(req.get_response(north))           # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | school                                |
     +------+-----------------------+--------+
     | code | name                  | campus |
    -+------+-----------------------+--------+-
     | eng  | School of Engineering | north  |

It is possible to configure more than one mask::

    >>> north = Rex('__main__', 'rex.db',
    ...     db="sqlite:./sandbox/db_demo.sqlite",
    ...     access={'rex.db': 'north'},
    ...     access_queries={'north': "true"},
    ...     access_masks=
    ...         {'north': ["school?campus='north'", "department?school.campus='north'"]})

    >>> req = Request.blank('/db/department', remote_user="Alice")
    >>> print(req.get_response(north))           # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | department                                  |
     +------+------------------------+-------------+
     | code | name                   | school_code |
    -+------+------------------------+-------------+-
     | be   | Bioengineering         | eng         |
     | comp | Computer Science       | eng         |
     | ee   | Electrical Engineering | eng         |
     | me   | Mechanical Engineering | eng         |

To avoid expensive filters, you can use replace them with query variables defined
with `htsql_environment` parameter::

    >>> north = Rex('__main__', 'rex.db',
    ...     db="sqlite:./sandbox/db_demo.sqlite",
    ...     access={'rex.db': 'north'},
    ...     access_queries={'north': "true"},
    ...     access_masks=
    ...         {'north': ["school?in(code,$USER_SCHOOLS)",
    ...                    "department?in(school.code,$USER_SCHOOLS)"]},
    ...     htsql_environment=
    ...         {'user_schools': "/school.filter(campus='north').code"})

    >>> req = Request.blank('/db/department', remote_user="Alice")
    >>> print(req.get_response(north))           # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | department                                  |
     +------+------------------------+-------------+
     | code | name                   | school_code |
    -+------+------------------------+-------------+-
     | be   | Bioengineering         | eng         |
     | comp | Computer Science       | eng         |
     | ee   | Electrical Engineering | eng         |
     | me   | Mechanical Engineering | eng         |

The value of a ``htsql_environment`` variable can also refer to a Python
function::

    >>> answer = Rex('__main__', 'rex.db',
    ...     db="sqlite:./sandbox/db_demo.sqlite",
    ...     htsql_environment={'answer': "rex.db_demo:answer_query"})

    >>> req = Request.blank('/db/$answer', remote_user="Alice")
    >>> print(req.get_response(answer))          # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
     | $answer |
    -+---------+-
     |       4 |


