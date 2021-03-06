************************************
  REX.ASSESSMENT_IMPORT Change Log
************************************

.. contents:: Table of Contents

0.6.0 (2018-01-05)
==================

* fixed calculations

0.5.2 (2017-02-10)
==================

* fixed tests

0.5.1 (2017-01-19)
==================

* fixed method ImportPackage.from_zip() to support folders inside archive.

0.5.0 (2016-12-02)
==================

* added functions import_assessment, export_template to replace classes.
* bugs fixed, code refactored

0.4.3 (2016-09-27)
==================

* Using Assessment.bulk_create(...) to create all assessments at once.
* Added setting assessment_import_dir to save failed import files.

0.4.2 (2016-06-01)
==================

* Fixed parameters checking
* Fixed tests.

0.4.1 (2016-02-06)
==================

* Updated error messages to show traceback for unknown fialures.

0.4.0
=====

* Added --format option for the rex assessment-import task, excepted csv or xls
  values; csv is the default value.
* Fixed bug when running using uwsgi

0.3.0 (2015-10-28)
==================

* Fixed Assessment.create.
* Updated assessment-import to commit all or nothing if record import failed.
* Fixed sorting issue for the instrument templates.
* Fixed regular expression for the check of float fields.

0.2.0 (2015-09-30)
==================

* API refactored


0.1.1 (2015-07-23)
==================

* Fixed generating values of empty recordLists.
