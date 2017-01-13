**********************
PostgresAsyncTransport
**********************


Set up the environment::

    >>> from rex.asynctask import get_transport
    >>> from rex.core import Rex
    >>> rex = Rex('rex.asynctask_demo')


Basic Operations
================

The basic operations of submitting and retrieving tasks should work as
expected::

    >>> rex.on()
    >>> transport = get_transport('pgsql:asynctask_demo')

    >>> transport.poll_queue('foo')
    0
    >>> transport.submit_task('foo', {'foo': 1})
    >>> transport.submit_task('foo', {'foo': 2})
    >>> transport.poll_queue('foo')
    2
    >>> transport.get_task('foo')
    {u'foo': 1}
    >>> transport.get_task('foo')
    {u'foo': 2}
    >>> transport.get_task('foo') is None
    True
    >>> transport.poll_queue('foo')
    0

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
    >>> transport = get_transport('pgsql:database_that_doesnt_exist')
    Traceback (most recent call last):
        ...
    Error: Failed to connect to the Postgres server:
        FATAL:  database "database_that_doesnt_exist" does not exist

    >>> rex.off()

