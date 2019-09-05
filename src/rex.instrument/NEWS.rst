*************************
REX.INSTRUMENT Change Log
*************************

.. contents:: Table of Contents


1.9.0
=====

* Added an ``execute_calculations`` function to the package to provide
  applications that do not use the full ``rex.instrument`` suite of APIs a
  means to execute RIOS calculations on an Assessment.


1.8.0 (2017-06-20)
==================

* Enhanced discrepancy identification to flag when a record must have at least
  one subfield's value specified in the solution.


1.7.1 (2017-01-19)
==================

* Fixed some issues with type-casting of CalculationSet results.


1.7.0 (2016-10-25)
==================

* Added a ``bulk_create()`` method to Assessment to facilitate features in
  ``rex.assessment_import``.
* The ``InstrumentError`` exception now inherits from ``rex.core.Error``.


1.6.1 (2016-08-12)
==================

* Fixed an issue that prevented task priorities from being longs.


1.6.0 (2016-07-14)
==================

* Updated rios.core dependency.


1.5.0 (2016-06-01)
==================

* The base implementation of ``Task.start_entry()`` will now create an
  Assessment if one does not exist before creating the Entry.


1.4.0 (2016-04-22)
==================

* Fixed an issue where the values for enumerationSet questions were considered
  discrepancies if the same set of enumerations were chosen, but in different
  orders.
* Added a ``calculation_set`` property to the InstrumentVersion and
  DraftInstrumentVersion classes.
* Fixed an issue that caused calculations to fail to save when HTSQL
  unexpectedly returned Decimals instead of floats.


1.3.0 (2016-01-29)
==================

* Added a ``bulk_retrieve()`` method to Assessment to facilitate features in
  the new ``rex.mart``.
* Updated rios.core dependency.
* Fixed discrepancy solving so that document-level metadata is no longer lost,
  but is instead merged/retained appropriately.


1.2.0 (2015-11-20)
==================

* Updated rex.ctl tasks to use log() function instead of print statements.
* Secured the HTSQL calculation proessing logic to prevent against writes to
  the database.
* Updated rios.core dependency.


1.1.0 (2015-10-21)
==================

* Updated all references of PRISMH to RIOS (including changing the dependency
  to rios.core).


1.0.0 (2015-09-30)
==================

* Finally, a major release!
* Updated prismh.core dependency.
* Added an interface class for DraftCalculationSet.
* Removed erroneous ``calculations`` key from CalculationSet.as_dict().
* Added a ``get_implementation()`` method to all Interface classes as a
  convenience wrapper around the same function in the utils module.
* Added ``presentation_type`` and ``only_presentation_type`` to the possible
  search critiera to the ``find()`` method on the Instrument class.


0.18.0 (2015-06-23)
===================

* Added ability to pass implementation-specific parameters to the ``create()``
  and ``save()`` methods of Assessment, CalculationSet, DraftInstrumentVersion,
  Entry, Instrument, InstrumentVersion, ResultSet, and Task. This is done via
  the ``implementation_context`` dictionary argument.
* Interface classes that accept the ``implementation_context`` argument also
  have a ``get_implementation_context()`` method that describes the extra
  variables that are allowed.
* Added ``create()`` and ``save()`` methods to the Subject class, and added the
  ability to update the ``mobile_tn``.
* The ``instrument-store`` and ``calculationset-store`` tasks now accept a
  ``--context`` option in order to provide implementation context parameters.
* Added a ``global_calculation_scope`` context manager to aid in writing tests
  for Python-callable calculations that rely on CalculationScopeAddons.


0.17.0 (2015-06-26)
===================

* Added support for the PRISMH Calculation Set specifications.

  * Added CalculationSet and ResultSet interface classes.
  * Added CalculationMethod and CalculationScopeAddon extension points.
  * Added a series of calculationset-* rex.ctl tasks to manage Calculation Set
    Definitions.
  * Updated Task.reconcile() to execute calculations on the Assessment if any
    are configured.


0.16.0 (2015-06-12)
===================

* Moved the Channel, Task, Entry, TaskCompletionProcessor, and
  ParameterSupplier interface classes from ``rex.forms`` to this package.
* Added a STATUS_FAILED status to Tasks.
* Added a ``presentation_type`` property to Channels.
* The Channel.find() method now allows searches based on ``presentation_type``.
* Added a ``mobile_tn`` property to Subjects.
* Added the setting ``instrument_default_required_entries`` to replace the
  corresponding setting that is no longer provided by ``rex.forms``.
* Removed the ``get_form()`` method from Tasks.
* Now using the ``prismh.core`` library for all configuration validation and
  output logic.
* Added ``get_full_type_definition()`` to InstrumentVersion.
* Added the ability to pass Instrument definitions directly to
  Assessment.generate_empty_data().
* The ``get_implementation()`` function now throws a NotImplementedError
  instead of returning ``None`` when an implementation could not be found.
* Added ``due_date`` property to Task.

Upgrade Notes
-------------

The Channel, Task, and Entry interface classes were moved from the
``rex.forms`` package to this package.  This means:

  * You'll need to update any import statements that refer to these classes.
  * When using the ``get_implementation()`` function, you no longer have to
    specify ``forms`` as the package argument for these classes.
  * Any place you used the ``forms_implementation`` setting in reference to
    these classes, you'll need to update it to ``instrument_implementation``.

The TaskCompletionProcessor and ParameterSupplier extensions were moved from
the ``rex.forms`` package to this package. Be sure to update any related
import statements.

Channels must be classifed according to the type of configurations they use
to present Instruments to users. The two supported types are ``form`` and
``sms``.

Tasks no longer have a ``get_form()`` method. To retrive a Form for a given
Task, you can instead do::

    Form.get_for_task(task, channel)

Identifier strings in the Instrument Definitions can no longer contain
underscore characters. Also, custom type names are now classifed as
Identifier strings.


0.15.0 (2015-05-05)
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

