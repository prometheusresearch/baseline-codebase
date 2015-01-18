*************************
  REX.DEPLOY Change Log
*************************

.. contents:: Table of Contents


2.1.0 (2015-XX-XX)
==================

* Do not use ``S`` in the random text generator.
* Include links to the default selector.
* Moved ``rex deploy`` and other commands from ``rex.ctl``.


2.0.0 (2015-01-05)
==================

* Refactored implementation and Python API.
* Support for type conversion and column reordering.
* Support for removing table data.
* Added ``include`` directive.
* Added ``audit`` trigger.


1.6.0 (2014-10-17)
==================

* Added support for generated identity columns.
* Create an index for each ``FOREIGN KEY`` constraint.
* Added ``default`` field for column facts.
* Added ``unique`` constraints for columns and links.
* Added raw SQL facts.


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


