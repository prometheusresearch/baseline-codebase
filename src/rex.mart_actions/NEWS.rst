***************************
REX.MART_ACTIONS Change Log
***************************

.. contents:: Table of Contents


0.9.0 (2018-xx-xx)
==================

* Updated dependencies.


0.8.0 (2018-01-05)
==================

* Added charting support to RexGuides.


0.7.1 (2017-07-18)
==================

* Fixed various actions so that they can accept entities indicating Marts for
  their input, allowing standard actions that operate with the
  rexmart_inventory table to interact with these actions.


0.7.0 (2017-06-21)
==================

* Updated rex.query and rex.mart.
* Completely revamped the RexGuide action to be more useful and easier to
  configure.
* Updated to support new ``rex.widget`` and bundling.


0.6.1 (2017-02-07)
==================

* Widened dependency range for rex.mart.


0.6.0 (2017-01-19)
==================

* Relaxed type convention for 'mart' context variable (now supports entity)


0.5.0 (2016-12-01)
==================

* Now displays column link information in data dictionary screens.
* Now displays enumeration descriptions in the data dictionary screens.
* Enumeration filters in Guides now have their choices sorted.
* Added a new action that integrates the new QueryBuilder application with Mart
  databases.


0.4.0 (N/A)
===========

* v0.4.0 was never actually released.


0.3.2 (2016-12-xx)
==================

* Widened dependency range for rex.mart.


0.3.1 (2106-09-29)
==================

* Fixed crash that occurs if Data Dictionary action APIs are invoked without
  a valid, specified mart.


0.3.0 (2016-08-12)
==================

* Updated JavaScript config for Babel-based building.
* The ``mart-guide-filter`` action has been updated so that the ``filters``
  property is now optional, and if not specified, will automatically
  introspect the table and add filters for all supported columns.


0.2.0 (2016-04-22)
==================

* Disabled some unnecessary form validations.
* Updated dependencies.


0.1.0 (2016-03-23)
==================

 * Initial implementation.

