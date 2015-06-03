*******************************
REX.ASYNCTASK Programming Guide
*******************************

.. contents:: Table of Contents


Overview
========

This package provides a simple means for RexDB applications to submit tasks to
be worked on asynchronously by background processes.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Usage
=====

Submitting Tasks
----------------

Submitting tasks to a queue is very straight-forward. You start by using the
``get_transport()`` function to receive an instance of the queue manager, then
use its ``submit_task()`` method to send the task to your desired queue::

    >>> from rex.core import Rex
    >>> from rex.asynctask import get_transport

    >>> with Rex('rex.asynctask_demo'):
    ...     transport = get_transport()
    ...     payload = {'foo': 'bar', 'baz': 123}
    ...     transport.submit_task('some_queue', payload)

Retrieving Tasks
----------------

Retrieving tasks from a queue is just as easy as sending them::

    >>> with Rex('rex.asynctask_demo'):
    ...     transport = get_transport()
    ...     payload = transport.get_task('some_queue')
    >>> payload
    {u'foo': u'bar', u'baz': 123}

Implementing Task Workers
-------------------------

To implement code that can be easily executed as a background process to
consume and process tasks on a queue, you implement the ``AsyncTaskWorker``
extension::

    >>> from rex.asynctask import AsyncTaskWorker
    >>> class MyWorker(AsyncTaskWorker):
    ...     name = 'my_worker'
    ...     def process(self, payload):
    ...         # Do whatever you want with the payload here.
    ...         print 'Received payload with foo=' % (payload['foo'],)

This worker can then be launched using the ``asynctask-workers`` command-line
task::

    rex asynctask-workers --set=asynctask_workers='{"queue_foo": "my_worker"}'


Settings
========

``rex.asynctask`` provides the following settings:

``asynctask_transport``
    Specifies the URI of the default transport to use in the application.

``asynctask_workers``
    This is a mapping of queue names to AsyncTaskWorker names that the
    ``asynctask-workers`` task will use to launch its child task worker
    processes.

``asynctask_workers_poll_interval``
    Specifies the number of milliseoncds the ``asynctask-workers`` task will
    wait between its attempts to retrieve tasks from queues. Defaults to
    ``500``.

``asynctask_workers_check_child_interval``
    Specifies the number of milliseconds the ``asynctask-workers`` task will
    wait between child process health checks. Defaults to ``1000``.


Command Line Tools
==================

This package contains a series of command line tools (exposed via ``rex.ctl``):

asynctask-workers
-----------------

This tool will launch a series of child processes that will each execute
``AsyncTaskWorker`` implementations upon specified queues. For each
queue/worker pair listed in the ``asynctask_workers`` setting, a child process
will spawn that will process tasks as they come across.

::

    rex asynctask-workers

