********
Settings
********

.. contents:: Table of Contents

Set up the environment::

    >>> from rex.core import Rex, get_settings


asynctask_workers
=================

This setting configures the workers that watch queues for tasks to process::

    >>> rex = Rex('rex.asynctask_demo')
    >>> with rex:
    ...     print(repr(get_settings().asynctask_workers))
    {'foo': Record(worker='demo_foo_worker', rate_max_calls=None, rate_period=None)}

    >>> rex = Rex('rex.asynctask_demo', asynctask_workers={'some_queue': {'worker': 'demo_bar_worker', 'rate_max_calls': 10}})
    >>> with rex:
    ...     print(repr(get_settings().asynctask_workers))
    {'foo': Record(worker='demo_foo_worker', rate_max_calls=None, rate_period=None), 'some_queue': Record(worker='demo_bar_worker', rate_max_calls=10, rate_period=None)}

    >>> rex = Rex('rex.asynctask_demo', asynctask_workers={'foo': None, 'some_queue': 'demo_bar_worker'})
    >>> with rex:
    ...     print(repr(get_settings().asynctask_workers))
    {'foo': None, 'some_queue': Record(worker='demo_bar_worker', rate_max_calls=None, rate_period=None)}


    >>> rex = Rex('rex.asynctask_demo', asynctask_workers={'some_queue': 'doesntexist'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Failed to match the value against any of the following:
        Expected one of:
            ctl_executor, demo_foo_worker, demo_bar_worker, demo_baz_worker, demo_logging_worker, demo_quiet_worker, demo_error_worker, demo_fragile_worker, requeue_worker
        Got:
            'doesntexist'
    <BLANKLINE>
        Expected a JSON object
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
    ...     print(repr(get_settings().asynctask_scheduled_workers))
    []

    >>> rex = Rex('rex.asynctask_demo', asynctask_scheduled_workers=[{'worker': 'demo_foo_worker', 'minute': '*/5'}, {'ctl': 'demo-noisy-task', 'hour': '*/3'}, {'worker': 'demo_foo_worker', 'second': 0}])
    >>> with rex:
    ...     print(repr(get_settings().asynctask_scheduled_workers))
    [Record(worker='demo_foo_worker', ctl=None, year=None, month=None, day=None, week=None, day_of_week=None, hour=None, minute='*/5', second=None, start_date=None, end_date=None), Record(worker=None, ctl='demo-noisy-task', year=None, month=None, day=None, week=None, day_of_week=None, hour='*/3', minute=None, second=None, start_date=None, end_date=None), Record(worker='demo_foo_worker', ctl=None, year=None, month=None, day=None, week=None, day_of_week=None, hour=None, minute=None, second=0, start_date=None, end_date=None)]


    >>> rex = Rex('rex.asynctask_demo', asynctask_scheduled_workers=[{'minute': '*/5'}])
    Traceback (most recent call last):
        ...
    rex.core.Error: Must specify one of 'worker' or 'ctl'
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
    rex.core.Error: Must specify one of 'worker' or 'ctl'
    While validating sequence item
        #1
    While validating setting:
        asynctask_scheduled_workers
    While initializing RexDB application:
        rex.asynctask_demo
    With parameters:
        asynctask_scheduled_workers: [{'worker': 'demo_foo_worker', 'ctl': 'demo-noisy-task', 'minute': '*/5'}]

    >>> rex = Rex('rex.asynctask_demo', asynctask_scheduled_workers=[{'worker': 'demo_foo_worker'}])
    Traceback (most recent call last):
        ...
    rex.core.Error: Must specify some property of the schedule
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
    rex.core.Error: Expected one of:
        ctl_executor, demo_foo_worker, demo_bar_worker, demo_baz_worker, demo_logging_worker, demo_quiet_worker, demo_error_worker, demo_fragile_worker, requeue_worker
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


