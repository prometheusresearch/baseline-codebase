*******************
RedisAsyncTransport
*******************


Set up the environment::

    >>> from rex.asynctask import get_transport
    >>> from rex.core import Rex
    >>> rex = Rex('rex.asynctask_demo')


Basic Operations
================

The basic operations of submitting and retrieving tasks should work as
expected::

    >>> rex.on()
    >>> transport = get_transport('redis://localhost')

    >>> transport.submit_task('foo', {'foo': 1})
    >>> transport.submit_task('foo', {'foo': 2})
    >>> transport.get_task('foo')
    {u'foo': 1}
    >>> transport.get_task('foo')
    {u'foo': 2}
    >>> transport.get_task('foo') is None
    True

    >>> transport.submit_task('foo', {'foo': 3})
    >>> transport.get_task('foo')
    {u'foo': 3}
    >>> transport.get_task('foo') is None
    True

    >>> transport.submit_task('bar', {'bar': 1})
    >>> transport.get_task('foo') is None
    True
    >>> transport.get_task('bar')
    {u'bar': 1}
    >>> transport.get_task('foo') is None
    True

    >>> transport.submit_task('BADNAME', {'baz': 1})
    Traceback (most recent call last):
        ...
    ValueError: "BADNAME" is not a properly-formatted queue name

    >>> transport.get_task('BADNAME')
    Traceback (most recent call last):
        ...
    ValueError: "BADNAME" is not a properly-formatted queue name

    >>> rex.off()


Connection Errors
=================

It will immediately raise an error when you specify a database that cannot be
connected to::

    >>> rex.on()
    >>> transport = get_transport('redis://hostname_that_doesnt_exist')
    Traceback (most recent call last):
        ...
    Error: Failed to connect to the Redis server:
        Error 8 connecting to hostname_that_doesnt_exist:6379. nodename nor servname provided, or not known.

    >>> rex.off()

