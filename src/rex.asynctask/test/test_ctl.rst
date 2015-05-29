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
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
    <BLANKLINE>

If no workers are configured, it will bail::

    >>> ctl('asynctask-workers rex.asynctask_demo --set=asynctask_workers={}')
    INFO:AsyncTaskWorkerTask:No workers configured; terminating.


blah::

    >>> worker_ctl = Ctl('asynctask-workers rex.asynctask_demo')
    >>> time.sleep(2)  # give the task a little time to spin up

    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()
    >>> transport = get_transport()
    >>> transport.submit_task('foo', {'foo': 1})
    >>> time.sleep(2)

    >>> print worker_ctl.stop()
    INFO:AsyncTaskWorkerTask:Launching demo_foo_worker to work on queue foo
    INFO:FooWorker:Starting; queue=foo
    FOO processed: {u'foo': 1}
    INFO:FooWorker:Terminating
    INFO:AsyncTaskWorkerTask:Complete
    <BLANKLINE>


    >>> rex.off()

