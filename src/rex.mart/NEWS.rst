*******************
REX.MART Change Log
*******************

.. contents:: Table of Contents


0.9.1
=====

* Updated ``cachetools`` dependency.


0.9.0
=====

* Added a ``DefinitionProducer`` extension to allow applications to extend
  how ``rex.mart`` retrieves the Definitions it uses.
* Added an implementation of a ``rex.job.JobExecutor`` named ``rexmart_create``
  to facilitate the creation of Marts via a GUI.


0.8.2 (2018-08-16)
==================

* Fixed an issue where schema modifications performed by SQL scripts were not
  seen by subsequent HTSQL scripts.


0.8.1 (2018-04-04)
==================

* Packaging tweak to satisfy new versions of pip.


0.8.0 (2018-01-03)
==================

* The ``mart_etl_htsql_gateways`` setting now allows you to specify a ``rexdb``
  gateway where you can configure whatever extensions you want, and
  ``rex.mart`` will then merge in its defaults.


0.7.3 (2017-10-02)
==================

* Fixed an issue that allowed fields in Assessments named ``id``.


0.7.2 (2017-09-15)
==================

* Improved the speed of loading Assessment data into the tables.


0.7.1 (2017-07-20)
==================

* Fixed an issue with including boolean fields in selector statements.
* Fixed an issue that caused creation to crash if the selector statement
  specified assessments that had no data.


0.7.0 (2017-06-20)
==================

* Fixed an issue that caused crashes when filtering identifiable fields from
  Marts that involved Instruments where fields changed their identifiable
  status between versions.
* Added the ability for Mart Definitions to invoke custom extensions which
  provide dynamic, creation-time definitions of Assessments to include in the
  creation of a Mart.


0.6.1 (2017-03-07)
==================

- Made some improvements to reduce the amount of memory consumed by
  ``mart-create`` on Definitions with many Assessments.
- Fixed some issues around the massaging of column names derived from RIOS
  Instruments to ensure uniqueness within a table.


0.6.0 (2017-02-07)
==================

- Added the ability to use ``rex.deploy``-provided HTSQL functions as well as
  the ``tweak.meta`` functionality in ETL queries against the ``rexdb``
  gateway.
- Fixed an issue where the data dictionary wouldn't include question text from
  Forms/Interactions when there are multiple versions of the Instrument.


0.5.0 (2016-12-14)
==================

- Added the ability to specify ``@ALL`` for the instrument in an assessment
  definition. This tells rex.mart that all active Instruments in the system
  should be automatically included in the Mart database.


0.4.0 (2016-12-01)
==================

- Fixed issue where quota system would purge good, complete Marts in favor of
  keeping bad, incompete Marts. Now incomplete Marts are ignored from the Quota
  system.
- The data dictionary column table now has a column that specifies what table
  a link field is connected to.
- The data dictionary column table now includes backlink columns child tables.
- The data dictionary will now classify both int4 and int8 fields as "integer".
- Added a ``get_htsql()`` method to Mart classes to make getting database
  connections a little easier.
- The data dictionary enumeration table now includes descriptions for the
  codes.
- The descriptions of Assessment table fields will now use the question text
  from any Forms or Interactions that are found for the corresponding
  Instruments.


0.3.1 (2016-08-30)
==================

- Fixed crash during creation when the system hosting the marts is different
  from the system hosting the management db.


0.3.0 (2016-08-12)
==================

- Updated rex.deploy dependency to address issues with large mart databases.
- Added a basic reference counting system to mart databases that facilitates
  edge cases where multiple application instances may be sharing the exact same
  mart databases.
- Added a new ``base.type`` for mart definitions called ``application``. It
  allows you to create a mart database that starts off as a copy of the main
  RexDB application database, but is simpler to use than ``copy`` because you
  do not have to know the name of the database ahead of time.


0.2.2 (2016-07-14)
==================

- Update rios.core dependency.


0.2.1 (2016-06-17)
==================

- Fixed an issue that prevented the creation of Assessment tables that included
  enumerationSet fields with purely numeric enumerations.


0.2.0 (2016-03-23)
==================

- Added ability to specify additional HTSQL extensions to enable in the
  get_mart_db() and get_mart_etl_db() functions.
- Added HTSQL connection caching to the web endpoint, as well as an associated
  ``mart_htsql_cache_depth`` setting.
- Fixed an issue that prevented the creation of Marts that included Instruments
  with enumerationSet fields that had enumerations with hyphens.
- Added the ability to define Mart Definition Parameters that can/must be
  supplied during the creation of Mart and are made available to all the
  queries within a Definition.
- Fixed issues with the ability to use the ``include`` fact within the
  rex.deploy configurations.


0.1.0 (2016-01-29)
==================

- Initial implementation.

