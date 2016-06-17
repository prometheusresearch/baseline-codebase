*******************
REX.MART Change Log
*******************

.. contents:: Table of Contents


0.2.2 (2016-xx-xx)
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

