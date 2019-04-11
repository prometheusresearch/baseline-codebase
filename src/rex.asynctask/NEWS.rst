************************
REX.ASYNCTASK Change Log
************************

.. contents:: Table of Contents


0.7.1
=====

* Fixed ``redis`` transport to work on Python 3.


0.7.0 (2018-04-24)
==================

* Typo in dependency metadata.
* Added an ``AmqpAsyncTransport`` for using AMQP servers to manage the task
  queues.
* Added the ability to configure processing rate limits on a per-queue basis.


0.6.0 (2017-06-20)
==================

* The ``asynctask_scheduled_workers`` setting is now merged.
* Adjusted the ``pgsql`` transport so that it no longer holds a persistent
  connection to the database. It only gets one when it needs it.
* Fixed an issue that prevented scheduled workers with zeros in their schedule
  config.
* The table created by the ``pgsql`` transport now exists in its own schema to
  avoid conflicting with tools like rex.deploy.


0.5.0 (2017-04-05)
==================

* Added a basic task scheduling system that allows workers and rex.ctl Tasks to
  be triggered via a crontab-like configuration.
* Added a quiet mode to the ``asynctask-workers`` rex.ctl task.
* Added the ``process_queue()`` and ``run_worker()`` functions to process tasks
  without needing to invoke the rex.ctl task.
* Changed ``get_transport()`` so that when the ``asynctask_transport`` setting
  is not set, it will use the application database defined by the ``db``
  setting, if it exists.
* The ``asynctask_workers`` application setting is now merged.
* Added an **experimental** ``FileSysAsyncTransport`` for persisting queues on
  the filesystem.


0.4.0 (2017-01-19)
==================

* Fixed issue with handling an ``asynctask_transport`` setting that looked like
  ``pgsql://databasename``.
* Added a ``requeue()`` method to ``AsyncTaskWorker`` to make resubmitting a
  task easier.
* Added a ``poll_queue()`` method to ``AsyncTransport`` to find how many tasks
  are currently waiting in a queue for processing.


0.3.1 (2016-08-12)
==================

* Minor tweaks to test suite.


0.3.0 (2016-01-29)
==================

* The ``asynctask_transport`` is no longer required, but the
  ``get_transport()`` function will now throw an exception if it isn't
  configured.


0.2.0 (2015-09-30)
==================

* Updated logging dependency.


0.1.0 (2015-06-26)
==================

* Initial release for review.

