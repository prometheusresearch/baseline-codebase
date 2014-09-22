*************************
  REX.DEPLOY Change Log
*************************

.. contents:: Table of Contents


1.6.0 (2014-XX-XX)
==================


1.5.0 (2014-07-18)
==================

* Added ability to rename an existing database.


1.4.0 (2014-06-27)
==================

* Added ability to specify the template for a new database.
* ``FOREIGN KEY`` constraints that are contained in ``PRIMARY KEY``
  are set with ``ON DELETE CASCADE``.


1.3.0 (2014-06-04)
==================

* Added ability to create ``UNLOGGED`` tables.


1.2.3 (2014-04-17)
==================

* Data fact can now process timezone-aware datetime values.


1.2.2 (2014-03-28)
==================

* Restored dependency on ``rex.db``.


1.2.1 (2014-03-07)
==================

* Updated dependencies.


1.2.0 (2014-01-24)
==================

* Store metadata as comments on tables, columns and other entities.
* Preserve and restore table, column and link labels when the SQL name is
  mangled.
* Added table, column and link titles.
* Added HTSQL plugin that generates HTSQL configuration from ``rex.deploy``
  metadata.


1.1.0 (2013-12-20)
==================

* Prevent creation of both a regular column and a link under the same label.
* Data fact accepts input in YAML and JSON formats.


1.0.0 (2013-12-13)
==================

* Initial implementation.


