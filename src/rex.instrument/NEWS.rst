*************************
REX.INSTRUMENT Change Log
*************************

.. contents:: Table of Contents


0.15.0 (2015-xx-xx)
===================

* Added a common/default implementation of Instrument.get_version().
* All find() methods now default to a limit of ``None``, which means no limit.
* Assessment.find() implementations must now support querying by instrument.
* Assessment objects now have a delete() method that can be implemented.


0.14.2 (2015-04-06)
===================

* Fixed regular expression governing custom type IDs to allow underscores.


0.14.1 (2015-03-26)
===================

* Publishing a DraftInstrumentVersion now automatically sets the version
  embedded in the definition to something appropriate.
* Fixed some issues with the outputting/formatting of definitions with
  non-ASCII characters.
* Fixed some issues with string encoding/decoding.


0.14.0 (2015-02-20)
===================

* Matrix columns can now be marked individually as identifiable.
* If not specifying the description of an enumeration in an Instrument
  definition, the value associated with the enumeration ID no longer has to be
  an empty dictionary/mapping. It can be null.
* The system will now automatically validate all InstrumentVersion definitions
  found in the datastore upon server startup. This can be disabled through a
  new setting named ``instrument_validate_on_startup``.
* Enumeration IDs now have slightly loosened format restrictions. They no
  longer must start with a letter, and they can be one character long. This
  means that you can now use numeric-looking strings as IDs (e.g., "1", "32").


0.13.0 (2015-01-30)
===================

- Added support for ``rex.setup`` v2.
- Refactored the demo/test package.
- Now using v2 of ``rex.ctl``.
- The ``instrument-validate`` and ``instrument-store`` commands will now accept
  YAML-formatted Instrument files, provided they adhere to the same structural
  requirements as the Common Instrument Specification.
- Added an ``output`` module with function and classes that can be used to
  output Instrument definitions in a human-friendly way, with either JSON or
  YAML.
- Added an ``instrument-format`` rex command to convert and/or reformat
  Instrument definitions.
- The ``instrument-retrieve`` rex command now accepts a ``format`` option to
  indicate that you want JSON or YAML returned.
- Added a ``definition_yaml`` property to the InstrumentVersion and
  DraftInstrumentVersion classes to get or set the Instrument definition using
  YAML.


0.12.0 (11/21/2014)
===================

- Improved Assessment schema validation logic to be more thorough.
- Fixed issues where defaulted dates were timezone-naive, and thus causing
  confusing shifts in date/time.


0.11.2 (9/17/2014)
==================

- Fixed an issue that caused required boolean fields to not allow False values
  in Assessments.
- The output from the instrument-retrieve command can now be optionally
  pretty-printed.


0.11.1 (9/3/2014)
=================

- Fixed an issue that occurred when validating Assessments with custom types.


0.11.0 (8/25/2014)
==================

- Added the ability for the as_dict() and as_json() methods to accept a list of
  extra parameters to include in their serializations that aren't included in
  the default list.
- Changed the Assessment.validate_data() method to take the raw Instrument
  Definition as its optional argument rather than an InstrumentVersion.
- Instrument.create() now takes a unique "code" rather than an explicit UID.
  This was done for consistency with other interface classes (all of which
  generate their own UIDs rather than having them be explicitly passed). In
  many implementations, this code will be used to generate the UID.
- Added a code property to Instrument.
- The get_subject() and find_subjects() methods on User have been replaced by
  more generic methods named get_object_by_uid() and find_objects().
- All get_by_uid() and find() methods now accept and optional user parameter to
  indicate that the resulting instance should be accessible by the specified
  User.
- Invalid JSON is now considered a ValidationError by
  Instrument.validate_definition() and Assessment.validate_data().


0.10.0 (7/31/2014)
==================

- Added ability to mark Instrument fields as containing PHI/PII.
- Enhanced Assessment.validate_data() method to perform Instrument-specific
  validation of the data structure, in addition to the base Common Assessment
  Document schema validation.
- Assessment data is now only validated upon complete, rather than on
  instantiation and assignment.
- InstrumentVersion will no longer validate the definition upon instantiation
  or assignment.
- Added a shared caching mechanism for use by implementations.
- Most sub-object properties now perform lazy retrieval with caching.
- The Instrument.get_latest_version() method has been changed to the
  "latest_version" property.
- Added a utility decorator to facilitate the memoization of properties.
- Instruments now have a status property.
- InstrumentVersions now have a published_by and date_published property.
- Added a new interface class in DraftInstrumentVersion to allow the management
  of InstrumentVersions that are in the process of being created and aren't
  ready for general use in the system.
- Users now have a get_subject() method.


0.9.1 (6/24/2014)
=================

- Packaging fix.


0.9.0 (6/24/2014)
=================

- Major overhaul of utility/interface classes.
- Moved schema validation logic of Instruments and Assessments from
  rex.validate into this module.
- Changed structure of Instrument and Assessment JSON representations.


0.2.0 (6/6/2014)
================

- Fixed an issue Calculations and missing names.
- Added support for an "Edited" state, allowing measures to be edited after
  they are completed.


0.1.7 (3/27/2014)
=================

- Documentation updates in preparation for open-sourcing.


0.1.4
=====

- added calculation support;


0.1.3
=====

- added workaround for descriptor issue;


0.1.2
=====

- add warning when storage is broken;
- minor fixes;

