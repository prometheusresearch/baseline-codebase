********
Settings
********

.. contents:: Table of Contents

Set up the environment::

    >>> from rex.core import Rex, get_settings


asynctask_workers
=================

This setting configures the workers that watch queues for tasks to process::

    >>> rex = Rex('rex.asynctask_demo', asynctask_workers={})
    >>> with rex:
    ...     print repr(get_settings().asynctask_workers)
    {}

    >>> rex = Rex('rex.asynctask_demo', asynctask_workers={'some_queue': 'demo_foo_worker'})
    >>> with rex:
    ...     print repr(get_settings().asynctask_workers)
    {'some_queue': 'demo_foo_worker'}


    >>> rex = Rex('rex.asynctask_demo', asynctask_workers={'some_queue': 'doesntexist'})
    Traceback (most recent call last):
        ...
    Error: Expected one of:
        demo_fragile_worker, ctl_executor, demo_bar_worker, demo_foo_worker, demo_baz_worker, demo_error_worker, requeue_worker
    Got:
        'doesntexist'
    While validating mapping value for key:
        'some_queue'
    While validating setting:
        asynctask_workers
    While initializing RexDB application:
        rex.asynctask_demo
    With parameters:
        asynctask_workers: {'some_queue': 'doesntexist'}


asynctask_scheduled_workers
===========================

This setting configures the workers that execute according to a schedule::

    >>> rex = Rex('rex.asynctask_demo', asynctask_scheduled_workers=[])
    >>> with rex:
    ...     print repr(get_settings().asynctask_scheduled_workers)
    []

    >>> rex = Rex('rex.asynctask_demo', asynctask_scheduled_workers=[{'worker': 'demo_foo_worker', 'minute': '*/5'}, {'ctl': 'demo-noisy-task', 'hour': '*/3'}])
    >>> with rex:
    ...     print repr(get_settings().asynctask_scheduled_workers)
    [Record(worker='demo_foo_worker', ctl=None, year=None, month=None, day=None, week=None, day_of_week=None, hour=None, minute='*/5', second=None, start_date=None, end_date=None), Record(worker=None, ctl='demo-noisy-task', year=None, month=None, day=None, week=None, day_of_week=None, hour='*/3', minute=None, second=None, start_date=None, end_date=None)]


    >>> rex = Rex('rex.asynctask_demo', asynctask_scheduled_workers=[{'minute': '*/5'}])
    Traceback (most recent call last):
        ...
    Error: Must specify one of 'worker' or 'ctl'
    While validating sequence item
        #1
    While validating setting:
        asynctask_scheduled_workers
    While initializing RexDB application:
        rex.asynctask_demo
    With parameters:
        asynctask_scheduled_workers: [{'minute': '*/5'}]

    >>> rex = Rex('rex.asynctask_demo', asynctask_scheduled_workers=[{'worker': 'demo_foo_worker', 'ctl': 'demo-noisy-task', 'minute': '*/5'}])
    Traceback (most recent call last):
        ...
    Error: Must specify one of 'worker' or 'ctl'
    While validating sequence item
        #1
    While validating setting:
        asynctask_scheduled_workers
    While initializing RexDB application:
        rex.asynctask_demo
    With parameters:
        asynctask_scheduled_workers: [{'ctl': 'demo-noisy-task', 'worker': 'demo_foo_worker', 'minute': '*/5'}]

    >>> rex = Rex('rex.asynctask_demo', asynctask_scheduled_workers=[{'worker': 'demo_foo_worker'}])
    Traceback (most recent call last):
        ...
    Error: Must specify some property of the schedule
    While validating sequence item
        #1
    While validating setting:
        asynctask_scheduled_workers
    While initializing RexDB application:
        rex.asynctask_demo
    With parameters:
        asynctask_scheduled_workers: [{'worker': 'demo_foo_worker'}]

    >>> rex = Rex('rex.asynctask_demo', asynctask_scheduled_workers=[{'worker': 'doesntexist'}])
    Traceback (most recent call last):
        ...
    Error: Expected one of:
        demo_fragile_worker, ctl_executor, demo_bar_worker, demo_foo_worker, demo_baz_worker, demo_error_worker, requeue_worker
    Got:
        'doesntexist'
    While validating field:
        worker
    While validating sequence item
        #1
    While validating setting:
        asynctask_scheduled_workers
    While initializing RexDB application:
        rex.asynctask_demo
    With parameters:
        asynctask_scheduled_workers: [{'worker': 'doesntexist'}]

