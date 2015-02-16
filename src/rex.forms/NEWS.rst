********************
REX.FORMS Change Log
********************

.. contents:: Table of Contents


0.28.0 (2015-xx-xx)
===================

- Updated ``instrument-formskeleton`` task to handle situations where
  enumeration definitions have null values in an Instrument Definition.
- When clicking the player controls on audio clips for enumerations, it will
  no longer select that enumeration.
- The system will now automatically validated all Form configurations found in
  the datastore upon server startup. This can be disabled through a new
  setting named ``forms_validate_on_startup``.
- Added support for the loosened format of Enumeration IDs.
- Added a new setting named ``forms_local_resource_prefix`` that can be used
  to prepend a string to the resource URLs referenced in Form configurations
  (such as Audio files). This value of this setting must be passed to the
  localResourcePrefix prop of the Form JS component.


0.27.0 (2015-01-30)
===================

- Added an optional ``facilitator`` property to the Task interface class.
- Added the ability to play audio files in the form by:

  - Added a new page element of type ``audio`` to allow the insertion of an
    audio file player at any position in the page.
  - Added a new ``audio`` property to Question element options, as well as
    enumeration and matrix row descriptors, which will show audio file players
    with the text of these objects.

- Added support for ``rex.setup`` v2.
- Refactored how the demo/test package works.
- The Task interface class no longer has a ``start()`` method.
- Implementations of the ``find()`` method on Tasks must now accept an
  ``asssessment`` search criteria.
- Fixed an issue where fields with textArea widgets weren't being disabled
  appropriately.
- Now using v2 of ``rex.ctl``.
- The ``forms-validate`` and ``forms-store`` commands will now accept
  YAML-formatted Form and Instrument files, provided they adhere to the same
  structural requirements as the specifications.
- The ``start_entry()`` method on Tasks now accepts an optional ``ordinal``
  argument.
- The ``find()`` and ``create()`` method on Entry now accepts an optional
  ``ordinal`` argument.
- The progress bar now only shows on the screen if there is more than one page
  in the Form.
- Added an ``output`` module with function and classes that can be used to
  output Form configurations in a human-friendly way, with either JSON or
  YAML.
- Added a ``forms-format`` rex command to convert and/or reformat Form
  configurations.
- The ``forms-retrieve`` rex command now accepts a ``format`` option to
  indicate that you want JSON or YAML returned.
- Added a ``configuration_yaml`` property to the Form and DraftForm classes to
  get or set the Form configuration using YAML.
- Added an ``instrument-formskeleton`` rex command that will generate a very
  basic Form configuration based on a specified Instrument definition.


0.26.0 (11/21/2014)
===================

- Integer values are now automatically bounded between -2147483648 and
  +2147483647 to provide better compatibility with downstream applications.
- Fixed issue where some browsers would sort the discrepancies on the
  reconciliation screen in odd ways when the form contains unprompted fields.
- "Complete Reconciliation" button is now disabled when the screen is first
  loaded, and becomes enabled when all discrepancies are addressed -- instead
  of the prior behavior of being hidden until all discrepancies are addressed.
- Client implementations can now pass a subtitle to display under the main
  title.
- Question error text now allows Creole markup.
- Text properties that allow Creole markup now also support Parameter
  substitution using the <<Parameter name>> macro.
- The "Manual Override" option on the reconciliation screen now highlights in
  the same manner as selecting a value from one of the Entries.
- The entryRadioGroup and entryCheckGroup widgets now accept a ``hotkeys``
  option that allows the custom configuration of the hotkeys to assign the
  enumerations in the widget.
- When switching Pages in a Form, the first Question on the Page is now
  automatically put into focus.
- The Entry interface class now has an ``ordinal`` property that contains the
  Entry's ordinal position in the collection of Entries associated with the
  Task.
- Implementations of the Task.find() method must now allow a list of statuses
  to match on.
- Removed the VALIDATING status from Tasks.
- Added a property named ``num_required_entries`` to the Task class that allows
  implementations to indicate how many Entries must be created and reconciled
  in order to complete the Task.
- Added a setting named ``forms_default_required_entries`` which gives the
  system a default value to use if a Task doesn't specify a value for its
  ``num_required_entries`` property.
- Added a property named ``can_enter_data`` to the Task class that allows
  implementations to provide an indicator for whether or not the Task is in a
  state that allows the creation of new Preliminary Entries.
- The ``can_reconcile`` property on the Task class is now abstract and must be
  implemented by concrete classes.
- Fixed issues where defaulted dates were timezone-naive, and thus causing
  confusing shifts in date/time.


0.25.1 (10/17/2014)
===================

- Fixed issue that caused crashes when tags were assigned to Questions.


0.25.0 (10/13/2014)
===================

- Added/Fixed the ability to target pages and element tag groups in events.
- Fixed an issue when trying to view Forms w/ Assessments that had matrix
  values set to null.
- Fixed an issue that caused the read-only view of form data to crash if the
  selected enumeration had hideEnumeration events associated with it.
- Fixed an issue where disabling recordList or matrix fields only partially
  did so.
- Loosened up text-based fields so that they can accept calculations that
  result in numeric values.
- Added enumeration-based widgets that support keyboard hotkeys.
- Fixed a crash that occurred when trying to reconcile matrix fields that are
  null.
- Fixed an issue where under certain circumstances the reconciler would get
  confused of the status of recordList/matrix sub-fields that had validations
  on them.
- Fixed issue where the Remove button for records in a recordList question
  would appear to be disabled if the first question in the recod is disabled.


0.24.0 (10/2/2014)
==================

- Added ability to reference enumerationSet fields in REXL expressions to
  receive a List of the selected enumerations.
- Added ability to reference recordList sub-fields in REXL expressions to
  receive a List of that field's values across the records in the recordList.
- Added ability to target ``hide``, ``disable``, and ``hideEnumeration``
  actions at the subfields within recordList and matrix questions.


0.23.0 (9/26/2014)
==================

- The JavaScript components are now using the RexI18N framework for
  localization.
- Fixed issues with referencing enumerationSet enumerations and matrix
  sub-fields in REXL expressions.
- Fixed some issues with REXL identifier resolution not returning correct data
  type.
- The radioGroup widget now includes the ability for users to clear out their
  selection.
- The progress bar is now measured as the current page over the total number of
  pages.
- Fixed the issue that prevented multiple events targetting the same field.
- The discrepancies listed on the Reconciliation screen are now in the same
  order as the fields appear in the original Form.
- Added text to screen to explain why the Next Page button is disabled.
- The "Complete Form" button now says "Review Responses" when in entry mode,
  and "Complete Form" when in review mode.
- Fixed issue of not being able to disable checkGroup, dropDown, or radioGroup
  widgets.
- The reconciliation screen now requires the user to explictly address each
  discrepancy listed, whether they choose an entered value or manually
  override the value. The "complete" button will now not appear until all
  discrepancies have been dealt with.
- The display of multi-line text on the review/read-only screen now actually
  shows the linebreaks instead of one continue string of text.


0.22.2 (9/17/2014)
==================

- Fixed a problem where the JS component would generate an Assessment document
  with parially-complete recordList records.
- Fixed a crash when finding discrepancies with enumerationSet fields.
- Fixed issues with displaying discrepancies for enumerationSet fields and
  fields using custom types.
- Fixed the enumeration/enumerationSet widgets displaying Yes/No as choices
  when the enumeration text for the question wasn't defined in the Form config.
- Fixed an issue where decimal numbers were being silently accepted and
  truncated when entered in integer fields.
- Fixed an issue where values with extra, non-numeric characters were being
  silently accepted and dropped in some situations when interacting with
  integer and float fields.
- When entering the "review" phase of completing a Form, the page will now
  scroll to the top of the Form.
- Fixed issues when solving discrepancies involving recordList and matrix
  fields that caused invalid Assessments to be generated.
- When tabbing through a Form, when an dropDown or radioGroup widget is
  encountered, the full list of choices is scrolled into view.
- Fixed issues with enumeration fields embedded within recordList and matrix
  fields not allowing more than one selection across all instances of that
  field.
- Required fields are now marked as such on the reconciliation screen.
- If the final value on the reconciliation screen is modified by hand, the
  previously-selected value is dehighlighted.
- Required rows in matrix fields are now flagged as such.
- Fixed an issue in reconciliation screen where it didn't reliably detect if
  all required values were entered.
- Fixed an issue that prevented the solving of discrepancies including an
  empty enumerationSet value.
- The output from the forms-retrieve command can now be optionally
  pretty-printed.


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

