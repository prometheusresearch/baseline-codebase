**********************
PostgresAsyncTransport
**********************


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> from rex.asynctask import get_transport
    >>> transport = get_transport('pgsql:asynctask_demo')


Basic Operations
================

The basic operations of submitting and retrieving tasks should work as
expected::

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

