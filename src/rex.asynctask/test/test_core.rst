*********
Core APIs
*********


Set up the environment::

    >>> from rex.asynctask import get_transport
    >>> from rex.core import Rex


get_transport
=============

The ``get_transport()`` function will retrieve the AsyncTransport
implementation for the specified URI, or for the URI in the
``asynctask_transport`` setting if none is passed::

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()

    >>> get_transport()
    PostgresAsyncTransport(localhost/asynctask_demo)

    >>> get_transport('pgsql:asynctask_demo?master_lock_id=999')
    PostgresAsyncTransport(localhost/asynctask_demo)

    >>> get_transport('localmem://')
    LocalMemoryAsyncTransport


It complains if the transport URI does not have a recognized schema::

    >>> get_transport('mysql:some_database')
    Traceback (most recent call last):
        ...
    ValueError: "mysql:some_database" does not resolve to a known AsyncTransport


It also complains if the transport URI is not defined::

    >>> rex.off()
    >>> rex = Rex('rex.asynctask')
    >>> rex.on()

    >>> get_transport()
    Traceback (most recent call last):
        ...
    rex.core.Error: Asynctask transport not specified

    >>> rex.off()
    >>> rex = Rex('rex.asynctask', 'rex.db', db='pgsql:asynctask_demo')
    >>> rex.on()

    >>> get_transport()
    PostgresAsyncTransport(localhost/asynctask_demo)

    >>> rex.off()


process_queue
=============

This function will process all tasks in the given queue::

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> from rex.asynctask import process_queue
    >>> transport = get_transport()

    >>> transport.submit_task('foo', {'bar': '1'})
    >>> transport.submit_task('foo', {'bar': '2'})
    >>> process_queue('foo')
    FOO processed: {'bar': '1'}
    FOO processed: {'bar': '2'}
    2

    >>> transport.submit_task('foo', {'bar': '1'})
    >>> process_queue('foo', worker_name='demo_bar_worker')
    BAR processed: {'bar': '1'}
    1

    >>> transport.submit_task('foo', {'bar': '1'})
    >>> transport.submit_task('foo', {'bar': '2'})
    >>> transport.submit_task('foo', {'bar': '3'})
    >>> process_queue('foo', worker_name='demo_logging_worker', quiet=True)
    3

    >>> process_queue('doesntexist')
    Traceback (most recent call last):
        ...
    rex.core.Error: Cannot identify worker for queue "doesntexist"

    >>> rex.off()


run_worker
==========

This function will execute a worker until it runs out of tasks::

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> from rex.asynctask import run_worker
    >>> transport = get_transport()

    >>> transport.submit_task('foo', {'bar': '1'})
    >>> transport.submit_task('foo', {'bar': '2'})
    >>> run_worker('demo_foo_worker')
    FOO processed: {'bar': '1'}
    FOO processed: {'bar': '2'}
    2

    >>> transport.submit_task('foo', {'bar': '1'})
    >>> run_worker('demo_bar_worker', queue_name='foo')
    BAR processed: {'bar': '1'}
    1

    >>> transport.submit_task('foo', {'bar': '1'})
    >>> transport.submit_task('foo', {'bar': '2'})
    >>> transport.submit_task('foo', {'bar': '3'})
    >>> run_worker('demo_logging_worker', queue_name='foo', quiet=True)
    3

    >>> run_worker('demo_baz_worker')
    Traceback (most recent call last):
        ...
    rex.core.Error: Cannot identify queue for worker "demo_baz_worker"

    >>> run_worker('doesntexist', queue_name='doesntmatter')
    Traceback (most recent call last):
        ...
    rex.core.Error: Worker "doesntexist" does not exist

    >>> rex.off()

