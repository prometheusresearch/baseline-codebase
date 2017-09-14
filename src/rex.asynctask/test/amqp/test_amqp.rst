******************
AmqpAsyncTransport
******************


Set up the environment::

    >>> import time, os
    >>> from rex.asynctask import get_transport
    >>> from rex.core import Rex
    >>> rex = Rex('rex.asynctask_demo')

    >>> CONNECTION_URI = os.environ['RABBIT_URL']

    >>> import pika
    >>> conn = pika.BlockingConnection(pika.URLParameters(CONNECTION_URI))
    >>> chan = conn.channel()
    >>> for q in ('foo', 'doesntexist', 'bar'):
    ...     _ = chan.queue_delete(q)
    ...     _ = chan.exchange_delete(q)
    >>> chan.close()
    >>> conn.close()


Basic Operations
================

The basic operations of submitting and retrieving tasks should work as
expected::

    >>> rex.on()
    >>> transport = get_transport(CONNECTION_URI)
    >>> transport  # doctest: +ELLIPSIS
    AmqpAsyncTransport(...)

    >>> transport.poll_queue('foo')
    0
    >>> transport.submit_task('foo', {'foo': 1})
    >>> transport.submit_task('foo', {'foo': 2})
    >>> time.sleep(1) ; transport.poll_queue('foo')
    2
    >>> transport.get_task('foo')
    {u'foo': 1}
    >>> transport.get_task('foo')
    {u'foo': 2}
    >>> transport.get_task('foo') is None
    True
    >>> transport.poll_queue('foo')
    0

    >>> transport.poll_queue('doesntexist')
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
    >>> transport = get_transport('amqp://doesntexist')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    Error: Failed to connect to the AMQP server:
        [Errno ...] nodename nor servname provided, or not known

    >>> rex.off()


