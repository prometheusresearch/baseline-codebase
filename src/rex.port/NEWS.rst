***********************
  REX.PORT Change Log
***********************

.. contents:: Table of Contents


1.3.2 (2018-01-23)
==================

* Disable global caching of prepared CRUD commands because it interferes with
  masking.


1.3.1 (2016-11-29)
==================

* Cache prepared insert, update and delete commands.


1.3.0 (2016-07-13)
==================

* Added ability to use port CRUD interface in HTSQL queries.
* Report an error when a table lacks identity.


1.2.0 (2016-01-29)
==================

* Another fix for global parameters.
* Allow direct links as entities.


1.1.1 (2015-11-20)
==================

* Fixed global parameters to work in calculated attributes.
* Fixed unquoting parameters.


1.1.0 (2015-09-30)
==================

* Added support for configuring global parameters.
* Allow calculated fields in ``select`` clause.


1.0.4 (2015-03-11)
==================

* ``setup.py``: removed ``setup_requires``.


1.0.3 (2015-01-30)
==================

* Updated test output.


1.0.2 (2015-01-05)
==================

* Updated dependencies.


1.0.1 (2014-10-16)
==================

* Retain titles of regular columns and calculated fields.


1.0.0 (2014-09-16)
==================

* Improving CRUD support, documentation.


0.2.0 (2014-08-27)
==================

* Cleaned up code, fixed bugs, improved error reporting.
* Added ``:USER`` and ``:FORMAT`` constraints.


0.1.0 (2014-06-27)
==================

* Prototype implementation.


