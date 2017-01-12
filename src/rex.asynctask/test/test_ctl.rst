*************
REX.CTL Tasks
*************

.. contents:: Table of Contents


Set up an environment::

    >>> from rex.asynctask import get_transport
    >>> from rex.core import Rex
    >>> from rex.ctl import Ctl, ctl
    >>> import time


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
    <BLANKLINE>

If no workers are configured, it will bail::

    >>> ctl('asynctask-workers rex.asynctask_demo --set=asynctask_workers={}')
    INFO:AsyncTaskWorkerTask:No workers configured; terminating.


Otherwise, it will launch the configured workers and attach them to their
specified queues::

    >>> worker_ctl = Ctl('asynctask-workers rex.asynctask_demo')
    >>> time.sleep(2)  # give the task a little time to spin up

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'foo': 1})
    >>> time.sleep(1)

    >>> print worker_ctl.stop()
    INFO:AsyncTaskWorkerTask:Launching demo_foo_worker to work on queue foo
    INFO:FooWorker:Starting; queue=foo
    FOO processed: {u'foo': 1}
    INFO:FooWorker:Terminating
    Coverage.py warning: Module rex.asynctask was previously imported, but not measured.
    INFO:AsyncTaskWorkerTask:Complete
    <BLANKLINE>

    >>> transport.get_task('foo') is None
    True

    >>> rex.off()


::

    >>> worker_ctl = Ctl("asynctask-workers rex.asynctask_demo --set=asynctask_workers='{\"foo\": \"requeue_worker\"}'")
    >>> time.sleep(2)  # give the task a little time to spin up

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'foo': 1})
    >>> time.sleep(2)

    >>> print worker_ctl.stop()  # doctest: +ELLIPSIS
    INFO:AsyncTaskWorkerTask:Launching requeue_worker to work on queue foo
    INFO:RequeueWorker:Starting; queue=foo
    REQUEUE processed: {u'foo': 1}
    REQUEUE requeued
    REQUEUE processed: {u'foo': 2}
    INFO:RequeueWorker:Terminating
    Coverage.py warning: Module rex.asynctask was previously imported, but not measured.
    INFO:AsyncTaskWorkerTask:Complete
    <BLANKLINE>

    >>> transport.get_task('foo') is None
    True

    >>> rex.off()


If the ``process()`` method of the ``AsyncTaskWorker`` should happen to raise
an exception, it won't cause the entire worker to die::

    >>> worker_ctl = Ctl("asynctask-workers rex.asynctask_demo --set=asynctask_workers='{\"foo\": \"demo_error_worker\"}'")
    >>> time.sleep(2)  # give the task a little time to spin up

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'error': True})
    >>> transport.submit_task('foo', {'error': False})
    >>> time.sleep(1)

    >>> print worker_ctl.stop()  # doctest: +ELLIPSIS
    INFO:AsyncTaskWorkerTask:Launching demo_error_worker to work on queue foo
    INFO:ErrorWorker:Starting; queue=foo
    ERROR:ErrorWorker:An unhandled exception occurred while processing the payload
    Traceback (most recent call last):
    ...
    Exception: Oops!
    ERROR processed: {u'error': False}
    INFO:ErrorWorker:Terminating
    Coverage.py warning: Module rex.asynctask was previously imported, but not measured.
    INFO:AsyncTaskWorkerTask:Complete
    <BLANKLINE>

    >>> transport.get_task('foo') is None
    True

    >>> rex.off()


If a worker dies, the master process will restart it::

    >>> worker_ctl = Ctl("asynctask-workers rex.asynctask_demo --set=asynctask_workers='{\"foo\": \"demo_fragile_worker\"}'")
    >>> time.sleep(1)  # give the task a little time to spin up

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'die': True})
    >>> time.sleep(2)
    >>> transport.submit_task('foo', {'die': False})
    >>> time.sleep(1)

    >>> print worker_ctl.stop()
    INFO:AsyncTaskWorkerTask:Launching demo_fragile_worker to work on queue foo
    INFO:FragileWorker:Starting; queue=foo
    FRAGILE DYING!
    Coverage.py warning: Module rex.asynctask was previously imported, but not measured.
    ERROR:AsyncTaskWorkerTask:Worker for queue foo died; restarting...
    INFO:AsyncTaskWorkerTask:Launching demo_fragile_worker to work on queue foo
    INFO:FragileWorker:Starting; queue=foo
    FRAGILE processed: {u'die': False}
    INFO:FragileWorker:Terminating
    Coverage.py warning: Module rex.asynctask was previously imported, but not measured.
    INFO:AsyncTaskWorkerTask:Complete
    <BLANKLINE>

    >>> transport.get_task('foo') is None
    True

    >>> rex.off()

