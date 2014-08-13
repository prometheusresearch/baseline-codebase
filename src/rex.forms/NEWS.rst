********************
REX.FORMS Change Log
********************

.. contents:: Table of Contents


0.22.0 (8/xx/2014)
==================

- Changed Form.validate_configuration() parameter naming to align to that used
  in the Assessment.validate_data() method.
- Addressed changes to the Assessment.validate_data() interface method.
- All get_by_uid() and find() methods now accept and optional user parameter to
  indicate that the resulting instance should be accessible by the specified
  User.
- Fixed rendering of boolean fields as dropDown widgets.
- Default date/time/dateTime fields are no longer gigantic.


0.21.0 (7/31/2014)
==================

- Added an extension called TaskCompletionProcessor to allow custom logic to
  be executed after a Task has been completed.
- Updated the Entry.validate_data() method to support the updated validation
  logic provided by Assessment.validate_data().
- Entry data is now only validated upon complete, rather than on
  instantiation and assignment.
- Form will no longer validation the configuration upon instantiation or
  assignment.
- Fixed issue with enumerations not showing.
- Updated references to Instrument.get_latest_version() to new property.
- Most sub-object properties now perform lazy retrieval with caching.
- Added new interface class in DraftForm to allow the management of Forms that
  are in the process of being created and aren't ready for general use in the
  system.


0.20.0 (6/30/2014)
==================

- Added JS component for facilitating Entry reconciliations.
- Fixed issue with discrepancy solving API not recognizing overrides of
  ``None``.
- Upgraded react-forms.


0.19.1-2 (6/24/2014)
====================

- Packaging fixes.


0.19.0 (6/24/2014)
==================

- Added a series of interface and utility classess, to mirror and function with
  those defined in ``rex.instrument``.
- Changed structure of Form JSON representation.
- Complete rewrite of form rendering library.


0.11.2 (6/17/2014)
==================

- Tightened the version bounds on rex.expression.


0.11.1 (6/2/2014)
=================

- Changed how the REXL/rex.expression library was referenced.


0.11.0
======

- Added support for slider widgets.


0.10.4
======

- Documentation updates in preparation for open-sourcing.


0.2.2
=====

- syncronization of versions in setup.py and in repository

0.2.1
=====

- fixed RELEASE-NOTES.rst

0.2.0
=====

- basic tests
- value validation by domains
- changed rendering of annotations and explanations
- more friendly preview mode

