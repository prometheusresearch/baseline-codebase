*************
REX.CTL Tasks
*************

.. contents:: Table of Contents


Set up an environment::

    >>> from rex.asynctask import get_transport
    >>> from rex.core import Rex
    >>> from rex.ctl import Ctl, ctl

    >>> def strip_coveragepy_warnings(output):
    ...     return '\n'.join([
    ...         line
    ...         for line in output.splitlines()
    ...         if not 'Coverage.py warning' in line
    ...     ])


asynctask-workers
=================

There is an ``asynctask-workers`` command that will start worker processes for
the queues configured in the application settings::

    >>> ctl('help asynctask-workers')
    ASYNCTASK-WORKERS - Launches processes for the rex.asynctask workers that are configured.
    Usage: rex asynctask-workers [<project>]
    <BLANKLINE>
    Starts worker processes according to the asynctask_workers setting that
    will continually watch the queues and process tasks as they come across.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --scheduler              : if specified, this process will act as the initiator for any ScheduledAsyncTaskWorkers that are configured. This should only be enabled for one process in cluster of workers.
      -q/--quiet               : if specified, no logging output will be produced
      --halt-when-empty        : if specified, workers will automatically stop running when they detect no more tasks are found in their queue.
    <BLANKLINE>

If no workers are configured, it will bail::

    >>> ctl('asynctask-workers rex.asynctask --set=asynctask_workers={}')
    INFO:AsyncTaskWorkerTask:No workers configured; terminating.

    >>> ctl("asynctask-workers rex.asynctask_demo --set=asynctask_workers='{\"foo\": null}'")
    INFO:AsyncTaskWorkerTask:No workers configured; terminating.


Otherwise, it will launch the configured workers and attach them to their
specified queues::

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'foo': 1})

    >>> worker_ctl = Ctl('asynctask-workers rex.asynctask_demo --halt_when_empty')
    >>> print(strip_coveragepy_warnings(worker_ctl.wait()))  # doctest: +ELLIPSIS
    INFO:AsyncTaskWorkerTask:Launching demo_foo_worker to work on queue foo
    INFO:FooWorker:Starting; queue=foo
    DEBUG:FooWorker:Got payload: {'foo': 1}
    FOO processed: {'foo': 1}
    DEBUG:FooWorker:Processing complete
    INFO:FooWorker:No tasks found in queue
    INFO:FooWorker:Terminating
    INFO:AsyncTaskWorkerTask:All workers halted; closing down...
    INFO:AsyncTaskWorkerTask:Complete

    >>> transport.get_task('foo') is None
    True

    >>> rex.off()


The ``--quiet`` option will suppress all logging::

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'error': False})

    >>> worker_ctl = Ctl("asynctask-workers rex.asynctask_demo --halt-when-empty --quiet --set=asynctask_workers='{\"foo\": \"demo_quiet_worker\"}'")
    >>> strip_coveragepy_warnings(worker_ctl.wait()) == ''
    True

    >>> transport.get_task('foo') is None
    True

    >>> rex.off()


Workers have the ability to resubmit the tasks they receive back into the
queue::

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'foo': 1})

    >>> worker_ctl = Ctl("asynctask-workers rex.asynctask_demo --halt-when-empty --set=asynctask_workers='{\"foo\": \"requeue_worker\"}'")
    >>> print(strip_coveragepy_warnings(worker_ctl.wait()))  # doctest: +ELLIPSIS
    INFO:AsyncTaskWorkerTask:Launching requeue_worker to work on queue foo
    INFO:RequeueWorker:Starting; queue=foo
    DEBUG:RequeueWorker:Got payload: {'foo': 1}
    REQUEUE processed: {'foo': 1}
    DEBUG:RequeueWorker:Requeued payload: {'foo': 2}
    REQUEUE requeued
    DEBUG:RequeueWorker:Processing complete
    DEBUG:RequeueWorker:Got payload: {'foo': 2}
    REQUEUE processed: {'foo': 2}
    DEBUG:RequeueWorker:Processing complete
    INFO:RequeueWorker:No tasks found in queue
    INFO:RequeueWorker:Terminating
    INFO:AsyncTaskWorkerTask:All workers halted; closing down...
    INFO:AsyncTaskWorkerTask:Complete

    >>> transport.get_task('foo') is None
    True

    >>> rex.off()


If the ``process()`` method of the ``AsyncTaskWorker`` should happen to raise
an exception, it won't cause the entire worker to die::

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'error': True})
    >>> transport.submit_task('foo', {'error': False})

    >>> worker_ctl = Ctl("asynctask-workers rex.asynctask_demo --halt-when-empty --set=asynctask_workers='{\"foo\": \"demo_error_worker\"}'")
    >>> print(strip_coveragepy_warnings(worker_ctl.wait()))  # doctest: +ELLIPSIS
    INFO:AsyncTaskWorkerTask:Launching demo_error_worker to work on queue foo
    INFO:ErrorWorker:Starting; queue=foo
    DEBUG:ErrorWorker:Got payload: {'error': True}
    ERROR:ErrorWorker:An unhandled exception occurred while processing the payload
    Traceback (most recent call last):
    ...
    Exception: Oops!
    DEBUG:ErrorWorker:Got payload: {'error': False}
    ERROR processed: {'error': False}
    DEBUG:ErrorWorker:Processing complete
    INFO:ErrorWorker:No tasks found in queue
    INFO:ErrorWorker:Terminating
    INFO:AsyncTaskWorkerTask:All workers halted; closing down...
    INFO:AsyncTaskWorkerTask:Complete

    >>> transport.get_task('foo') is None
    True

    >>> rex.off()


If a worker dies, the master process will restart it::

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'die': True})
    >>> transport.submit_task('foo', {'die': False})

    >>> worker_ctl = Ctl("asynctask-workers rex.asynctask_demo --halt-when-empty --set=asynctask_workers='{\"foo\": \"demo_fragile_worker\"}'")
    >>> print(strip_coveragepy_warnings(worker_ctl.wait()))  # doctest: +ELLIPSIS
    INFO:AsyncTaskWorkerTask:Launching demo_fragile_worker to work on queue foo
    INFO:FragileWorker:Starting; queue=foo
    DEBUG:FragileWorker:Got payload: {'die': True}
    FRAGILE DYING!
    ERROR:AsyncTaskWorkerTask:Worker for queue foo died; restarting...
    INFO:AsyncTaskWorkerTask:Launching demo_fragile_worker to work on queue foo
    INFO:FragileWorker:Starting; queue=foo
    DEBUG:FragileWorker:Got payload: {'die': False}
    FRAGILE processed: {'die': False}
    DEBUG:FragileWorker:Processing complete
    INFO:FragileWorker:No tasks found in queue
    INFO:FragileWorker:Terminating
    INFO:AsyncTaskWorkerTask:All workers halted; closing down...
    INFO:AsyncTaskWorkerTask:Complete

    >>> transport.get_task('foo') is None
    True

    >>> rex.off()

