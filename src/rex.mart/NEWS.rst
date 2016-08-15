*******************
REX.MART Change Log
*******************

.. contents:: Table of Contents


0.4.0 (2016-xx-xx)
==================

- Fixed issue where quota system would purge good, complete Marts in favor of
  keeping bad, incompete Marts. Now incomplete Marts are ignored from the Quota
  system.


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

