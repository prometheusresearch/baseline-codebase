**********************
  REX.WEB Change Log
**********************

.. contents:: Table of Contents


4.1.0 (2019-11-11)
==================

* Use ``rex.core.RexJSONEncoder`` in ``json`` Jinja filter.


4.0.0 (2019-08-05)
==================

* Ported from ``PyCrypto`` to ``cryptography``.


3.11.1 (2017-10-03)
===================

* Sentry: when Sentry DSN refers to the local host, rewrite the public DSN
  to match the host name of the request.


3.11.0 (2017-07-18)
===================

* Support for replay logs.


3.10.0 (2017-06-20)
===================

* Use JSON for uWSGI configuration.
* Added ``services`` setting.
* Added ``rex watch`` command for running asset generators in watch mode.
* Added ``rex.web.find_assets_bundle()`` funciton which discovers asset bundles
  for an application.


3.9.0 (2017-04-05)
==================

* Added Sentry support.


3.8.0 (2016-10-25)
==================

* Support for auto-documenting commands.


3.7.2 (2016-09-14)
==================

* Allow ``Jinja2==2.8.0``.


3.7.1 (2016-08-11)
==================

* Emit "500 Internal Server Error" on unexpected exceptions.
* ``rex start`` and ``rex serve-uwsgi`` display uncaught exceptions with
  ``--debug``.


3.7.0 (2016-03-23)
==================

* Export ``encrypt_and_sign`` and ``validate_and_decrypt``.


3.6.0 (2016-01-29)
==================

* Added ability to establish permission-specific execution context with
  ``confine()``.


3.5.0 (2015-06-12)
==================

* Added option ``--environ``.


3.4.0 (2015-04-23)
==================

* Added option ``--watch-package``.


3.3.1 (2015-03-11)
==================

* Removed ``setup_requires`` from ``setup.py``.


3.3.0 (2015-02-20)
==================

* Do not hide files starting with ``_`` (but only if ``static/www.yaml``
  is present).


3.2.0 (2015-01-30)
==================

* Added ``rex`` commands for serving the application.
* Interpret files with unknown mime type as ``application/octet-stream``.


3.1.0 (2014-12-08)
==================

* Added middleware interface ``Pipe``.
* Use named priorities for ``Route`` interface.


3.0.0 (2014-08-27)
==================

* Refactoring ``Route`` interface.
* Made ``PathMap`` iterable.


2.2.3 (2014-07-18)
==================

* Fixed a bug which prevented setting of a session cookie on static resource.
* Added workarounds for ``mod_proxy_uwsgi`` mishandling ``SCRIPT_NAME`` and
  ``PATH_INFO``.


2.2.2 (2014-07-14)
==================

* Set ``Cache-Control: private`` header on static resources.


2.2.1 (2014-07-06)
==================

* Pregenerate random encryption keys on startup to work better with
  multiprocess wsgi servers.


2.2.0 (2014-06-27)
==================

* When reporting duplicate paths, display the targets.
* When the URL matches a command path except for the trailing ``/``,
  redirect to URL + ``/``.


2.1.0 (2014-04-16)
==================

* Added function ``url_for()`` and Jinja filter ``url`` that convert
  ``<package>:<path>`` to a URL.


2.0.0 (2014-03-07)
==================

* Added setting ``access``; enhanced ``authorize()``.
* Added path matching utilities.


1.1.1 (2013-12-13)
==================

* Minor updates to test data.


1.1.0 (2013-11-20)
==================

* Force the ``urlencode`` filter to escape the ``/`` character.
* Made the routing pipeline extensible.
* Added NIH acknowledgement (Clark Evans).


1.0.0 (2013-10-11)
==================

* Initial implementation (Kyrylo Simonov).


