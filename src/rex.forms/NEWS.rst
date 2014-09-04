********************
REX.FORMS Change Log
********************

.. contents:: Table of Contents


0.22.2 (9/xx/2014)
==================

- Fixed a problem where the JS component would generate an Assessment document
  with parially-complete recordList records.


0.22.1 (9/3/2014)
=================

- Fixed an issue where the reconciler JS component would crash if it
  encountered a null value.


0.22.0 (8/25/2014)
==================

- Changed Form.validate_configuration() parameter naming to align to that used
  in the Assessment.validate_data() method.
- Addressed changes to the Assessment.validate_data() interface method.
- All get_by_uid() and find() methods now accept and optional user parameter to
  indicate that the resulting instance should be accessible by the specified
  User.
- Fixed rendering of boolean fields as dropDown widgets.
- Default date/time/dateTime fields are no longer gigantic.
- Fixed an issue where matrix questions couldn't define their rows.
- It's now possible to cancel the input of an optional explanation/annotation.
- Invalid JSON is now considered a ValidationError by
  Form.validate_configuration().
- The forms-validate command now takes an option to specify the Instrument JSON
  to validate against.
- Fixed an issue where the target property on an Event Object wasn't being
  treated as an array.
- The target property on an Event Object in a Form Configuration has been
  renamed to "targets".
- Fixed an issue where the hideEnumeration action was hiding objects listed in
  the "targets" property rather than the "enumerations" option.
- Fixed an issue where the calculation action was performing calculations based
  on the expression in the "targets" property rather than the "calculation"
  option.
- Added support for calculating the values of unprompted fields.
- The fail action now takes the error message to display from the "text"
  option.
- Fixed issue of enumeration, enumerationSet, and boolean fields not displaying
  the proper text for the selected choices on the review screen.
- Added ability to configure the labels of the buttons on the recordList
  widget.


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

