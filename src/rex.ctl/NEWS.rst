**********************
  REX.CTL Change Log
**********************

.. contents:: Table of Contents


3.0.0 (2019-XX-XX)
==================

* Removed dependency on Cogs.


2.3.0 (2017-04-05)
==================

* Added Sentry support.


2.2.0 (2016-10-25)
==================

* Support for ``autorex``-generated documentation.
* Fix for newer IPython.


2.1.1 (2016-02-29)
==================

* Fixed test breakups.


2.1.0 (2015-11-20)
==================

* Added ``rex --quiet`` parameter to suppress console output.


2.0.2 (2015-09-30)
==================

* ``rex pyshell`` enchancements: fixed the name of the application variable;
  added tab completion to native Python shell.


2.0.1 (2015-04-23)
==================

* Added an implementation of ``rex demo-cron`` command.


2.0.0 (2015-01-30)
==================

* Added ``rex pyshell`` command.
* Added ``--verbose`` flag for ``rex packages`` and ``rex settings``.
* Moved package-specific commands to the respective packages.
* Added class-based API that wraps Cogs API.
* Improved ``doctest`` testing with coverage support.


1.6.0 (2014-12-08)
==================

* Added ``rex query``.
* ``rex start`` sets ``master: true`` parameter.


1.5.0 (2014-11-21)
==================

* Added ``rex start``, ``rex stop`` and ``rex status`` tasks.
* Removed tests that fail when run under root.


1.4.2 (2014-09-16)
==================

* Updated test output.


1.4.1 (2014-08-06)
==================

* Fixed some tests.
* ``rex serve-uwsgi``: do not remove the ``.wsgi`` file on startup.


1.4.0 (2014-06-27)
==================

* Added ``rex serve-wsgi`` task.
* Added ``--watch`` option to ``rex serve`` and ``rex serve-uwsgi``.


1.3.0 (2014-04-16)
==================

* Added option ``--quiet`` for ``rex deploy`` and other database management
  tasks.


1.2.0 (2014-03-07)
==================

* Added option ``--remote-user`` for ``rex serve`` task.


1.1.1 (2013-12-20)
==================

* Require the latest version of Cogs.


1.1.0 (2013-12-13)
==================

* Added ``rex createdb``, ``rex dumpdb`` and other database management tasks.
* Added ``rex shell`` and ``rex deploy``.
* Renamed ``rex help packages`` to ``rex packages``, ``rex help settings`` to
  ``rex settings``.
* Enable tasks conditionally on the presence of relevant packages.
* Added NIH acknowlegement (Clark Evans).


1.0.0 (2013-10-14)
==================

* Initial implementation (Kyrylo Simonov).


