*********************
  REX.DB Change Log
*********************

.. contents:: Table of Contents


2.1.0 (2014-XX-XX)
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


