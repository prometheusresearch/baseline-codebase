*******************
RedisAsyncTransport
*******************


Set up the environment::

    >>> import os
    >>> from rex.asynctask import get_transport
    >>> from rex.core import Rex
    >>> rex = Rex('rex.asynctask_demo')


Basic Operations
================

The basic operations of submitting and retrieving tasks should work as
expected::

    >>> rex.on()
    >>> transport = get_transport('redis://' + os.environ.get('REDISHOST', 'localhost'))
    >>> transport  # doctest: +ELLIPSIS
    RedisAsyncTransport(...)

    >>> transport.poll_queue('foo')
    0
    >>> transport.submit_task('foo', {'foo': 1})
    >>> transport.submit_task('foo', {'foo': 2})
    >>> transport.poll_queue('foo')
    2
    >>> transport.get_task('foo')
    {'foo': 1}
    >>> transport.get_task('foo')
    {'foo': 2}
    >>> transport.get_task('foo') is None
    True
    >>> transport.poll_queue('foo')
    0

    >>> transport.poll_queue('doesntexist')
    0

    >>> transport.submit_task('foo', {'foo': 3})
    >>> transport.get_task('foo')
    {'foo': 3}
    >>> transport.get_task('foo') is None
    True

    >>> transport.submit_task('bar', {'bar': 1})
    >>> transport.get_task('foo') is None
    True
    >>> transport.get_task('bar')
    {'bar': 1}
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
    >>> transport = get_transport('redis://hostname_that_doesnt_exist')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.core.Error: Failed to connect to the Redis server:
        Error ... connecting to hostname_that_doesnt_exist:6379. ... not known.

    >>> rex.off()

