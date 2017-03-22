************************
REX.ASYNCTASK Change Log
************************

.. contents:: Table of Contents


0.5.0 (2017-xx-xx)
==================

* Added a basic task scheduling system that allows workers and rex.ctl Tasks to
  be triggered via a crontab-like configuration.


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

