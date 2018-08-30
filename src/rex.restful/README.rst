*****************************
REX.RESTFUL Programming Guide
*****************************

.. contents:: Table of Contents


Overview
========

This package provides a simple framework for implementing RESTful APIs on the
RexDB platform.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


RestfulLocations
================

The core functionality exposed by this package is contained in the
``RestfulLocation`` class. It is an extension that functions in much the same
way that a ``rex.web.Command`` would, but with extra functionality:

* Individual HTTP methods are routed to specific methods on the class, rather
  than leaving you to identify and route the logic appropriately.
* Data sent by the client during POST and PUT requests is automatically decoded
  into native Python objects for you (currently supports both JSON and YAML
  encoding methods).
* The data returned by your implementation methods is automatically encoded
  into the client's desired encoding method.
* Appropriate HTTP status codes are returned for the methods that are invoked.

To implement a resource that is capable of being retrieved, updated, and
deleted, you extend the ``RestfulLocation`` class along the lines of the
following example::

    >>> from rex.core import StrVal
    >>> from rex.restful import RestfulLocation
    >>> from rex.web import Parameter

    >>> class FooResource(RestfulLocation):
    ...     access = 'anybody'
    ...     path = '/foo/{foo_id}'
    ...     parameters = (
    ...         Parameter('foo_id', StrVal()),
    ...     )
    ... 
    ...     def retrieve(self, request, foo_id, **params):
    ...         return {'foo': foo_id, 'action': 'retrieve'}
    ... 
    ...     def update(self, request, foo_id, **params):
    ...         return {'foo': foo_id, 'action': 'update', 'payload': request.payload}
    ... 
    ...     def delete(self, request, foo_id, **params):
    ...         pass

When the ``/foo/{foo_id}`` path receives a GET request, the ``retrieve`` method
is automatically invoked on the class::

    >>> from rex.core import Rex
    >>> from webob import Request
    >>> rex = Rex('__main__', 'rex.restful')

    >>> with rex:
    ...     req = Request.blank('/foo/42', method='GET')
    ...     print((req.get_response(rex)))
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 35
    <BLANKLINE>
    {"action": "retrieve", "foo": "42"}

Similarly, when the ``/foo/{foo_id}`` path receives a PUT request, the
``update`` method is automatically invoked on the class, and the data sent by
the client is automatically decoded according to the Content-Type and made
available on the ``payload`` property of the request::

    >>> with rex:
    ...     req = Request.blank('/foo/42', method='PUT')
    ...     req.body = '{"happy": true, "bar": "baz"}'
    ...     req.headers['Content-Type'] = 'application/json'
    ...     print((req.get_response(rex)))
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: 75
    <BLANKLINE>
    {"action": "update", "foo": "42", "payload": {"bar": "baz", "happy": true}}

When sent an OPTIONS request, the path will respond with all the methods it
suppports::

    >>> with rex:
    ...     req = Request.blank('/foo/42', method='OPTIONS')
    ...     print((req.get_response(rex)))
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 0
    Allow: OPTIONS, PUT, DELETE, GET


SimpleResource
==============

A common pattern when implementing RESTful APIs is to have a higher-level URI
handle collection-types of operations on resources (such as searching or
creating), whereas lower-level URIs handle operations on specific resources.
For example, the ``/baz`` URI would refer to the collection of all "baz"
resources in the system, whereas ``/baz/42`` would refer to a specific instance
of a "baz" resource.

This package contains a class that can be used to easily implement this type of
pattern in a RexDB application. To do so, you create a class that inherits from
the ``SimpleResource`` class similar to the following example::

    >>> from rex.restful import SimpleResource

    >>> class BazResource(SimpleResource):
    ...     access = 'anybody'
    ...     path = '/baz/{baz_id}'
    ...     parameters = (
    ...         Parameter('baz_id', StrVal()),
    ...     )
    ...     base_path = '/baz'
    ... 
    ...     def list(self, request, **params):
    ...         return [
    ...             {'baz': 1},
    ...             {'baz': 2},
    ...         ]
    ... 
    ...     def create(self, request, **params):
    ...         return {'baz': 'new', 'action': 'create'}
    ... 
    ...     def retrieve(self, request, baz_id, **params):
    ...         return {'baz': baz_id, 'action': 'retrieve'}
    ... 
    ...     def delete(self, request, baz_id, **params):
    ...         pass

When the ``/baz`` path receives a GET request, the ``list`` method is
automatically invoked on the class::

    >>> rex = Rex('__main__', 'rex.restful')

    >>> with rex:
    ...     req = Request.blank('/baz', method='GET')
    ...     print((req.get_response(rex)))
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 24
    <BLANKLINE>
    [{"baz": 1}, {"baz": 2}]

When the ``/baz/123`` path receives a GET request, the ``retrieve`` method is
automatically invoked on the class::

    >>> with rex:
    ...     req = Request.blank('/baz/123', method='GET')
    ...     print((req.get_response(rex)))
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 36
    <BLANKLINE>
    {"action": "retrieve", "baz": "123"}

The ``/baz/123`` path can also handle a DELETE request, which invokes the
``delete`` method::

    >>> with rex:
    ...     req = Request.blank('/baz/123', method='DELETE')
    ...     print((req.get_response(rex)))
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0

But, if you try that on the ``/baz`` path, you'll get an error because
deletion is not a container-level action::

    >>> with rex:
    ...     req = Request.blank('/baz', method='DELETE')
    ...     print((req.get_response(rex)))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

When sent an OPTIONS request, the paths will respond with all the methods they
suppport::

    >>> with rex:
    ...     req = Request.blank('/baz', method='OPTIONS')
    ...     print((req.get_response(rex)))
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 0
    Allow: OPTIONS, POST, GET

    >>> with rex:
    ...     req = Request.blank('/baz/42', method='OPTIONS')
    ...     print((req.get_response(rex)))
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 0
    Allow: OPTIONS, DELETE, GET


Logging
=======

The `SimpleResource`_ method handlers will automatically log out the headers
and bodies of both the incoming requests and outgoing responses to the
``rex.restful.wire.request`` and ``rex.restful.wire.response`` loggers,
respectively. By default, this logging is disabled. If you want to receive
this logging, then you must configure those loggers to have a level of ``INFO``
to get the bodies, or ``DEBUG`` to get the bodies and headers.

For example, to see everything logged, add the following to your
``settings.yaml``::

    logging_loggers:
      rex.restful.wire.request:
        level: DEBUG
      rex.restful.wire.response:
        level: DEBUG



