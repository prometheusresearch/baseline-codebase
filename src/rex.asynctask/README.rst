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
    ...         print(('Received payload with foo=' % (payload['foo'],)))

This worker can then be launched using the ``asynctask-workers`` command-line
task::

    rex asynctask-workers --set=asynctask_workers='{"queue_foo": "my_worker"}'


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


Scheduled Tasks
===============

The ``asynctask-workers`` command has the ability to automatically initiate the
execution of workers using a crontab-like scheduling mechanism. This
functionality is enabled by doing two things:

* Pass the ``--scheduler`` option when executing ``rex asynctask-workers``. Be
  sure that you only do this to **ONLY ONE** execution of ``asynctask-workers``
  within a cluster of workers. Specifying it to more than one will cause
  multiple executions for each scheduled instance.

* Configure the ``asynctask_scheduled_workers`` setting to specify which
  workers need to be executed and on what schedule.

The following syntax would cause the ``my_worker`` task to be executed every 5
seconds::

  rex asynctask-workers --scheduler --set=asynctask_scheduled_workers='[{"worker": "my_worker", "second": "*/5"}]'

**CAVEAT**: This functionality is **not** recommended as an outright
replacement of the normal crontab fucntionality available on all systems. This
is a convenience mechanism intended for use by applications that have already
implemented a series of ``AsyncTaskWorkers``, and simply want to add scheduled
execution of their tasks. If your project is not already using
``rex.asynctask``, and you want to schedule execution of code in your
environment, then you should use the normal method of implementing
``rex.ctl.Task`` classes and using crontab to execute them.


Settings
========

``rex.asynctask`` provides the following settings:

.. autorex:: rex.core.Setting
   :package: rex.asynctask


Transports
==========
There is an extensible variety of transports that can be used to transmit and
persist task queues.

``pgsql``
---------
Uses a PostgreSQL database to store the tasks. The tasks are stored in a table
named ``asynctask_queue`` in the ``asynctask`` schema (``rex.asynctask`` will
create the schema and table automatically if they don't already exist).

Example configurations::

    asynctask_transport: pgsql:database
    asynctask_transport: pgsql://hostname/database
    asynctask_transport: pgsql://user:password@hostname:port/database

``filesystem``
--------------
Uses the local filesystem to store the tasks. The tasks are stored in files in
the specified directory (``rex.asynctask`` create the directory if it does not
already exist). This transport is not recommended for situations where the
``asynctask-workers`` process is being run on a different machine from the
application that is submitting the tasks.

Example configurations::

    asynctask_transport: filesys:/path/to/queue/directory

``redis``
---------
Uses a Redis server to store the tasks. The tasks are stored in per-queue list
keys.

Example configurations::

    asynctask_transport: redis://hostname
    asynctask_transport: redis://hostname:port?db=2

``amqp``
--------
Uses an AMQP server (e.g., RabbitMQ) to store the tasks. The tasks are stored
in durable queues attached to simple exchanges sharing the same name (and
routing key).

Example configurations::

    asynctask_transport: amqp://user:password@hostname:port/vhost



