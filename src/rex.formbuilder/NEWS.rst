**************************
REX.FORMBUILDER Change Log
**************************

.. contents:: Table of Contents


5.9.3 (2017-10-12)
==================

* Pinning a JavaScript dependency to a known-compatible version.


5.9.2 (2017-06-21)
==================

* Updated to work with the new ``rex.widget`` and bundling.


5.9.1 (2017-02-07)
==================

* Updated some JS dependencies to fix styling conflicts with other packages.


5.9.0 (2016-12-01)
==================

* Fixed various issues around the drag-and-drop functionality in the GUI.


5.8.1 (2016-09-14)
==================

* Fixed the error messages that display when the application encounters a
  configuration it does not support. These messages now display more details
  about the offending element/field.
* Fixed an issue that allowed too many Channels to be used in certain
  implementations.


5.8.0 (2016-08-12)
==================

* Added  ``formbuilder-pick-draft`` and ``formbuilder-edit-draft`` action types
  for use in rex.action wizards.
* Removed inappropriate properties from Boolean field.
* Added support for Boolean fields represented as DropDown widgets.


5.7.0 (2016-04-22)
==================

* Fixed an issue where FireFox would highlight the float range constraint
  input boxes when you entered a float value, even though there was nothing
  wrong.
* Fixed an issue that prevented the removal of pattern constraints on text
  questions.
* Boolean fields now allow you to set hotkeys for the true & false choices.
* Added a new Lookup Text question element that provides support for using the
  lookupText widget on text questions.


5.6.2 (2016-02-29)
==================

* Fixed an issue where zero wouldn't be saved as un upper or lower numeric
  constraint bounds.
* Fixed an issue where ranged properties weren't displaying error messages.


5.6.1 (2016-02-06)
==================

* Fixed an issue where publishing a form would show a confusing error if the
  screen was not configured to return to another URL.


5.6.0 (2016-01-29)
==================

* Removed rex.applet dependency
* Fixed erroneous display of tags property on recordList & matrix subfields.
* Added support for "identifiable" property on calculations.
* Fixed Instrument Creation form to require codes > 2 characters.


5.5.0 (2015-11-20)
==================

* The user is now redirected to the revision/draft list screen after publishing
  a Form from the editor screen.
* Fixed issue where imported forms with questionable configurations could cause
  failures when saving hotkeys.
* Added ability to configure external Form Parameters.


5.4.0 (2015-10-21)
==================

* Added ability to set the defaultLocalization of a Form.
* Added ability to provide localizations for text and audio properties.
* Elements in the workspace now turn red when their configuration becomes
  invalid.
* Clicking outside modal dialogs no longer cancels them.
* Fixed issue where audio help file config wasn't being cloned.


5.3.0 (2015-09-30)
==================

* Updated instrument and forms dependencies.
* Added a "back" button to configuration error modals.
* The Published Revision list is now most-recent-first.
* Rearranged the DraftSetEditor action buttons to follow a the typical
  workflow.
* The Element Property Editor modals now display the type of Element being
  edited.
* The Draft Revision list now has a button to initiate editing of the draft,
  rather than clicking anywhere on the listing.
* Fixed some issues around drag-selecting text in the Property Editors.
* Fixed issues around displaying Elements in the DraftSetEditor that have
  really long text labels.
* Added support for defining hotkeys for enumeration questions.
* Added support for the orientation display property of enumeration questions.
* Added initial support for defining Events.
* Added support for configuring the explanation/annotation field properties.
* Added support for the widget size properties of text and numeric questions.
* Added support for Audio elements and audio properties of questions and
  enumerations.
* Fixed field identifier validation to adhere to PRISMH spec.
* Added support for configuring CalculationSet definitions as part of
  DraftSets.
* Improved loading time of the draft editor.
* Added ability to configure Question Grids (aka, matrix fields).
* Fixed issue where the list of instruments/drafts/revisions was capped at 100
  items.
* The "Create New Draft" button is now hidden if there are published revisions
  exist for the Instrument.


5.2.2 (2015-06-23)
==================

* Updated instrument and forms dependencies.
* Added compatibility with ``rex.setup`` v3.


5.2.1 (2015-06-26)
==================

* Updated instrument dependency.


5.2.0 (2015-06-12)
==================

* Minor updates due to refactoring of rex.instrument/rex.forms APIs and the
  introduction of non-form-based Channels.


5.1.0 (2015-05-08)
==================

* Added ability to configure Repeating Groups (aka, recordList fields).
* Fixed issue with hitting enter in a modal form causing a browser submit.
* Added ability to drag toolbox elements directly to the desired position in
  the workspace.
* Removed unused Tags property from Page Start elements.


5.0.1 (2014-04-08)
==================

* Fixed issue when trying to edit Instruments/Forms on a system with only one
  Channel configured.


5.0.0 (2015-03-26)
==================

* Completely redesigned, refocused, and rebuilt.

  We can rebuild him. We have the technology. We can make him better than he
  was. Better... stronger... faster.


4.1.1 (2015-03-11)
==================

* Use React from npm

