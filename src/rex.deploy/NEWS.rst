*************************
  REX.DEPLOY Change Log
*************************

.. contents:: Table of Contents


2.11.0 (2019-XX-XX)
===================

* Use ``jsonb`` type for storing JSON values.


2.10.1 (2018-03-23)
===================

* Require ``psycopg2<2.7`` to avoid a warning about the psycopg2 wheel package.


2.10.0 (2017-06-20)
===================

* Fixed driver-catalog GC cycle.
* Conversion from HTSQL records to JSON objects.


2.9.1 (2017-02-15)
==================

* Removed the test on ``median()``.


2.9.0 (2017-01-19)
==================

* Implemented aggregate ``median()``.


2.8.1 (2016-10-25)
==================

* Added ``autorex``-based documentation for tasks.


2.8.0 (2016-09-14)
==================

* Added option ``rex deploy --analyze``.
* Allow ``Jinja2==2.8.0``.


2.7.0 (2016-08-11)
==================

* Use ``int8`` for integer columns.


2.6.0 (2016-07-13)
==================

* Support for calculated fields.
* Identity-to-text conversion.
* Added backlink introspection.
* Fixed duplicate random keys.
* Prohibit self-referential mandatory links and identity loops.


2.5.0 (2016-02-29)
==================

* Added support for psycopg2 >= 2.5.
* Support for serializing facts in YAML.
* Documentation for model entities.


2.4.1 (2016-01-29)
==================

* Reset schema cache after executing a raw DDL fact.
* Added SQL serializer for JSON values.


2.4.0 (2015-10-21)
==================

* Links may set the default value.


2.3.3 (2015-09-30)
==================

* Populate ``column.has_default`` for HTSQL catalog.
* Fixed missing schema updates when configuration does not change.


2.3.2 (2015-06-12)
==================

* Added a workaround for PostgreSQL dropping constraint comments.
* Allow deleted fields in ``with`` clause.
* Fixed incompatibility with ``tweak.override`` HTSQL plugin.
* Added ``json_get_json()`` function.


2.3.1 (2015-04-07)
==================

* Fixed the audit trigger to work with JSON values.


2.3.0 (2015-03-23)
==================

* Allow automatic text to JSON conversion for ETL commands.


2.2.1 (2015-03-11)
==================

* ``setup.py``: removed ``setup_requires``, added ``dependency_links``.


2.2.0 (2015-02-20)
==================

* Wrapped mathematical functions.


2.1.0 (2015-01-30)
==================

* Do not use ``S`` in the random text generator.
* Include links to the default selector.
* Moved ``rex deploy`` and other commands from ``rex.ctl``.
* Added ``json`` data type.
* Made ``Model`` an extension.
* Moved functions ``re_matches()``, ``ft_matches()``, ``ft_headline()``,
  ``ft_rank()``, ``ft_query_matches()``, ``ft_query_headline()``,
  ``ft_query_rank()``, ``join()`` from ``rex.rdoma``.


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


