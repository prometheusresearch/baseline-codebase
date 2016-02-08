*********************
  REX.DB Change Log
*********************

.. contents:: Table of Contents


3.4.1 (2016-XX-XX)
==================

* Minor documentation updates.


3.4.0 (2016-01-29)
==================

* Added parameters ``user_query``, ``auto_user_query``, ``access_queries``,
  ``access_masks``. ``htsql_environment``, ``query_timeout``.
* Establish security context for ``/db/`` requests.
* Fixed an issue with duplicate gateway handlers.
* ``Query``: added ability to specify parameters.


3.3.1 (2015-07-31)
==================

* Improved performance of masking.


3.3.0 (2015-06-12)
==================

* Added ``rex sqlshell`` command.
* ``Query`` now supports gateways.


3.2.0 (2015-04-23)
==================

* ``get_db(name)`` raises ``KeyError`` if the gateway is not configured.


3.1.1 (2015-03-11)
==================

* ``setup.py``: removed ``setup_requires``, added ``dependency_links``.


3.1.0 (2015-01-30)
==================

* Moved ``rex shell``, ``rex query`` and ``rex graphdb`` from ``rex.ctl``.
* Moved ``describe()`` and ``pivot()`` commands from ``rex.htraf``.


3.0.0 (2014-12-08)
==================

* Added middleware that wraps requests in a transaction.
* Added support for gateway databases.
* Support for session users, masks.


2.1.1 (2014-08-29)
==================

* Support for ``rex.web==3.0.0``.


2.1.0 (2014-06-27)
==================

* Remove an extra top-level record in JSON output when the top-level
  value is a record.
* Do not strip ``NULL`` values in JSON output.


2.0.1 (2014-03-28)
==================

* Disable some extensions when ``rex.rdoma`` is enabled.


2.0.0 (2014-03-07)
==================

* Removed ``htsql_access`` setting; use package permissions instead.
* Removed ``/describe()`` command from the ``rex`` HTSQL addon.


1.1.0 (2013-12-20)
==================

* Allow tunneling of HTSQL queries in a POST body.


1.0.1 (2013-11-20)
==================

* Use validators to parse `*.htsql` files.
* Added NIH acknowlegment (Clark Evans).


1.0.0 (2013-10-11)
==================

* Initial implementation (Kyrylo Simonov).


