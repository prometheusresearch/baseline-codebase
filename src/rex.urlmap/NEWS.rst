*************************
  REX.URLMAP Change Log
*************************

.. contents:: Table of Contents


2.6.2 (2015-XX-XX)
==================

* Handle undefined gateways.


2.6.1 (2015-03-11)
==================

* ``setup.py``: removed ``setup_requires``.


2.6.0 (2015-01-30)
==================

* Added ``gateway`` parameter for port and query definitions.


2.5.1 (2015-01-08)
==================

* Fixed dependencies.


2.5.0 (2014-09-19)
==================

* Added ``read-only`` flag for port definitions.


2.4.0 (2014-09-16)
==================

* Added ``Map`` interface to define ``urlmap.yaml`` entry types.
* Support for widgets is moved to ``rex.widget``.


2.3.0 (2014-08-28)
==================

* Updated dependency on ``rex.port``.
* Support for widgets.


2.2.0 (2014-06-27)
==================

* Support for *port* and *query* handlers.
* When the URL matches a path except for the trailing ``/``,
  redirect to URL + ``/``.


2.1.0 (2014-03-28)
==================

* Support for ``!setting`` tag in ``urlmap.yaml``.


2.0.0 (2014-03-07)
==================

* When URL permission is not specified explicitly, use package permission.
* Use ``rex.web`` syntax for URL masks.


1.0.1 (2013-12-13)
==================

* Updated YAML validation.


1.0.0 (2013-11-20)
==================

* Initial implementation (Kyrylo Simonov).


