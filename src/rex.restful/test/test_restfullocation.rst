***************
RestfulLocation
***************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.restful.command import RestfulLocation
    >>> from webob import Request
    >>> from rex.core import Rex


Definition
==========

To define a REST endpoint, inherit from the ``RestfulLocation`` class and
implement at least one of the ``create``, ``retrieve``, ``update``, or
``delete`` methods::

    >>> rex = Rex('__main__', 'rex.restful')
    >>> rex.on()

    >>> class TestResource(RestfulLocation):
    ...     path = '/test/{test_id}'
    ...     def retrieve(self, request, test_id, **kwarg):
    ...         return {'foo': test_id}

    >>> class FailedResource(RestfulLocation):
    ...     path = '/something'
    ...     def do_something(self):
    ...         pass
    Traceback (most recent call last):
        ...
    AssertionError: No resource methods defined on __main__.FailedResource

    >>> TestResource in RestfulLocation.all()
    True
    >>> FailedResource in RestfulLocation.all()
    Traceback (most recent call last):
        ...
    NameError: name 'FailedResource' is not defined

    >>> rex.off()


Resource Methods
================

Set up the environment::

    >>> rex = Rex('rex.restful_demo')
    >>> rex.on()

When the Resource receives a GET request, the ``retrieve`` method is invoked::


    >>> req = Request.blank('/foo/42')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### RETRIEVING FOO 42
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"foo": "42"}

When the Resource receives a PUT request, the ``update`` method is invoked::

    >>> req = Request.blank('/foo/42', method='PUT')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### UPDATING FOO 42
    ###   PAYLOAD: {}
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"foo": "42"}

To send a dataset to the ``update`` method, put the data in the body of the
request and make sure the HTTP Content-Type header is set correctly::

    >>> req = Request.blank('/foo/42', method='PUT')
    >>> req.body = '{"happy": true, "bar": "baz"}'
    >>> req.headers['Content-Type'] = 'application/json'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### UPDATING FOO 42
    ###   PAYLOAD: {u'bar': u'baz', u'happy': True}
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"foo": "42"}

When the Resource receives a POST request, the ``create`` method is invoked::

    >>> req = Request.blank('/foo/42', method='POST')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATING FOO 42
    ###   PAYLOAD: {}
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"foo": "42"}

To send a dataset to the ``create`` method, put the data in the body of the
request and make sure the HTTP Content-Type header is set correctly::

    >>> req = Request.blank('/foo/42', method='POST')
    >>> req.body = '{"happy": true, "bar": "baz"}'
    >>> req.headers['Content-Type'] = 'application/json'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATING FOO 42
    ###   PAYLOAD: {u'bar': u'baz', u'happy': True}
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"foo": "42"}

When the Resource receives a DELETE request, the ``delete`` method is invoked::

    >>> req = Request.blank('/foo/42', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### DELETING FOO 42
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0


When the Resource receives an OPTIONS request, it will return a list of the
HTTP verbs it accepts::

    >>> req = Request.blank('/foo/42', method='OPTIONS')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 0
    Allow: OPTIONS, PUT, POST, DELETE, GET

    >>> req = Request.blank('/bar/123', method='OPTIONS')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/html; charset=UTF-8
    Content-Length: 0
    Allow: OPTIONS, GET

The encoding of the return data can be specified by setting the Accept HTTP
header, or by adding a ``format`` querystring parameter::

    >>> req = Request.blank('/foo/42')
    >>> req.accept = 'application/x-yaml'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### RETRIEVING FOO 42
    200 OK
    Content-Type: application/x-yaml
    Content-Length: ...
    <BLANKLINE>
    {foo: '42'}
    <BLANKLINE>

    >>> req = Request.blank('/foo/42?format=yaml')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### RETRIEVING FOO 42
    200 OK
    Content-Type: application/x-yaml
    Content-Length: ...
    <BLANKLINE>
    {foo: '42'}
    <BLANKLINE>

    >>> req = Request.blank('/foo/42?format=somethingfake')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### RETRIEVING FOO 42
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"foo": "42"}

Sending an empty body will be interpreted as an empty dictionary::

    >>> req = Request.blank('/foo/42', method='POST')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATING FOO 42
    ###   PAYLOAD: {}
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: 13
    <BLANKLINE>
    {"foo": "42"}

    >>> req = Request.blank('/foo/42', method='POST')
    >>> req.headers['Content-Type'] = 'application/x-yaml'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    ### CREATING FOO 42
    ###   PAYLOAD: {}
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: 13
    <BLANKLINE>
    {"foo": "42"}

Sending an invalidly-formatted body will result in an HTTP 400::

    >>> req = Request.blank('/foo/42', method='POST')
    >>> req.body = '[garbage}'
    >>> req.headers['Content-Type'] = 'application/json'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "The incoming payload could not be deserialized (No JSON object could be decoded)"}

    >>> req = Request.blank('/foo/42', method='POST')
    >>> req.body = '[garbage}'
    >>> req.headers['Content-Type'] = 'application/x-yaml'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "The incoming payload could not be deserialized (while parsing a flow sequence\n  in \"<string>\", line 1, column 1:\n    [garbage}\n    ^\nexpected ',' or ']', but got '}'\n  in \"<string>\", line 1, column 9:\n    [garbage}\n            ^)"}

Calling a method that is not implemented on the resource will result in a HTTP
405::

    >>> req = Request.blank('/bar/123', method='DELETE')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


Errors
======

HTTP Exceptions raised by the methods will be encoded in the same manner as a
normal response::

    >>> req = Request.blank('/fail', method='PUT')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    402 Payment Required
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Show me the money"}

Any other exceptions will result in a hard failure::

    >>> req = Request.blank('/fail')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    Exception: This always fails

Sending an unexpected querystring parameter will result in an HTTP 400::

    >>> req = Request.blank('/foo/42?hello=goodbye', method='POST')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "Received unexpected parameter:\n    hello"}

