**************
  Change Log
**************

2.11.1 (2017-01-19)
===================

* [FIX] Test suite

2.11.0 (2016-12-01)
===================

* [FEAT] Add 'code' formfield

2.10.0 (2016-10-26)
===================

* [FEAT] Add documentation hooks.
* [FIX] Fix styles for file upload.

2.9.1 (2016-09-22)
==================

* [FIX] Validation of raw widgets.
* [FIX] Fix es2015 spec compat (duplicate named exports).

2.9.0 (2016-09-14)
==================

* [FEATURE] Remove slots (deprecated long ago)
* [FIX] Better inferrences for form fields withing list formfields

2.8.0 (2016-08-12)
==================

* [FEATURE] Allow nested widget hierarchies.

2.7.0 (2016-07-15)
==================

* [FEATURE] Support rex.menu.
* [FEATURE] Update react-stylesheet & react-dom-stylesheet.

2.6.0 (2016-06-01)
==================

* [FEATURE] Allow <IconButton /> with custom icons.

2.5.1 (2016-05-04)
==================

* [FIX] Enable experimental IPad support


2.5.0 (2016-05-XX)
==================

* [FIX] Move hint under the input in form fields to prevent misalignment in
  horizontal layouts.

* [FIX] Show hint for <RepeatingFieldset /> and <Fieldset /> components.

* [FIX] <RepeatingFieldset /> now render required sign if it's provided.

2.5.0 (2016-04-22)
==================

* [FEATURE] Configure webpack for code splitting.

* [FEATURE] Add ``onBeforeSubmit`` callback to ``<Form />``.

* [FEATURE] Add ``entity-list`` form field type. Works the same as ``entity`` but renders
  as a checkbox group and returns a list of identifiers::

    - type: entity-list
      value_key: individual
      data: ...

* [FEATURE] Add alternative widget for ``entity`` form field type to render a radio button
  group. Use by specifying ``using`` param::

    - type: entity
      value_key: individual
      data: ...
      using: radio-group

* [FEATURE] By default uknown form fields now defaults to type ``any`` in form validation
  schema.

* [FEATURE] Show validation errors for read only felds.

* [FEATURE] Various UI improvements and fixes.


2.4.0 (2016-03-31)
==================

* Add support for fieldsets to render its fields in read only mode.

* Add test comprehensive suite.

* Add test utils (`rex-widget/testutils` module).

* Fix transitionable decoding for widgets to be compatible with ES2015 modules.


2.3.0 (2016-03-23)
==================

* Bug fixes.


2.2.0 (2016-02-29)
==================

* ``Request`` now can be used to request data in transit encoding via
  ``asTransitionable()`` method.

* Bug fixes for ``<TabList />`` styles to be consistent with other UI elements.


2.1.0 (2016-02-06)
==================

* Add preview for conditional form fields functionality.

  All form fields now accept ``hide_if`` field which allow to specify a
  JavaScript boolean expression which hides a corresponding field. JavaScript
  expression has access to the current form field value and a value of the
  fieldset the current field is in::

    - type: string
      value_key: city
      hide_if: $fields.country != 'Russia'


2.0.0 (2016-01-31)
==================

* **BREAKING CHANGE:** Rex Widget now exposes most of the functionality through
  ES6 Modules::

    import {Button} from 'rex-widget/ui'

  instead of::

    var RexWidget = require('rex-widget')
    var Button = RexWidget.Button

  previously.

  Details of the new API comes soon with the updated docs and demo.

* **BREAKING CHANGE:** ``<Button />`` component was re-made from scratch and
  feature different style architecture. Button variants are different
  components::

    <SuccessButton />

  instead of::

    <Button type="success" />

  previously.

* **BREAKING CHANGE**: ``<Tabs />`` and ``<Tab />`` were reimplemented with the
  new API.

  Use::

    import {TabList, Tab} from 'rex-widget/ui'

  or::

    import {PillList, Pill} from 'rex-widget/ui'

  instead. Interface is similar but there were few props renamed:

  * ``active`` to ``selected``
  * ``onActive`` to ``onSelected``
  * ``buttonsPosition`` to ``position``
  * ``buttonsStyle`` is removed, use either ``<TabList />`` or ``<PillList />``
    to control tab list appearance.

* **BREAKING CHANGE**: ``RexWidget.Icon`` was removed.

  Use::

    import {Icon} from 'rex-widget/ui'

  instead.

* **BREAKING CHANGE**: ``RexWidget.Layout.VBox`` and ``RexWidget.Layout.HBox``
  were removed and replaced with ``rex-widget/layout`` API.

* **BREAKING CHANGE**: ``RexWidget.DataTable`` was removed.

  Use::

    import {DataTable} from 'rex-widget/datatable'

  instead.

* **BREAKING CHANGE**: Data specification API was removed and replaced with the
  new data API residing in ``rex-widget/data`` module.

* **BREAKING CHANGE**: Bootstrap CSS library was removed. Application which base
  their styles on Bootstrap should include it in their dependencies.

* New stylesheet API residing in ``rex-widget/stylesheet`` module.

* New helper API for CSS generation residing in ``rex-widget/css`` module.

* New Chrome widget feature. Allows to specify a widget which
  wraps every top-level widget in an application. Can be used to implement
  app-wide UI features like navigation bars, footers and so on.

* New layout primitives based on flexbox residing in ``rex-widget/layout``
  module.

* ``Mutation`` now can be configured with params via ``.params()`` method.

* ``autobind`` decorator exposed through ``rex-widget/lang`` module::

      import {autobind} from 'rex-widget/lang'

1.4.2 (2015-11-23)
==================

* Fix pagination on touch devices for datatable widget.

1.4.1 (2015-11-23)
==================

* Fix scrolling on touch devices for datatable widget.

1.4.0 (2015-11-20)
==================

* New API for data fetching from ports and queries based on Higher-order
  Components.

1.3.1 (2015-11-23)
==================

* Fix scrolling on touch devices for datatable widget.

1.3.0 (2015-10-21)
==================

* Add new ``<DataTable />`` widget::

    import DataTable from 'rex-widget/lib/datatable/DataTable'

  with better behaviour regarding column resize.

1.2.0 (2015-09-30)
==================

* Form field ``file`` now has read only mode.

* Min/max validators for datepicker.

* Fixes to datetimepicker and datepicker.

* Fixes to autocomplete widget.

1.1.1 (2015-09-03)
==================

* Various bug fixes.

1.1.0 (2015-09-03)
==================

* New styles for buttons.

1.0.3 (2015-07-23)
==================

* Convert JS package to be npm package (due to Rex Setup changes).

* Move forms code to be in React Forms.

* <RepeatingFieldset /> now supports baseIndex.

* <Autocomplete /> now shows a button which activates selection.

* <DataTable /> now allows to inject custom cell renderers.

* Move away from Bluebird and use core-js Promise polyfill instead.

* Internal refactorings.

1.0.2 (2015-06-29)
==================

* Fix build on npm 1.3.x

1.0.1 (2015-06-26)
==================

* Multiple bug fixes.

* Assume react-docgen is in the path and installed.

* Update documentation to explain 1.0.0.

1.0.0 (2015-06-12)
==================

* (breaking) Removed application state handling, `StateField` and
  `Widget.define_state` removed as well. Use `@computed_field` instead to
  provide computed data to widgets.

* (breaking) Removed widget templates.

* (new feature) Slots are allowed with then URL mapping entries for widget.
  Their values can be supplied via `slots` key in entry override.

* Multiple bug fixes and numerous features.

0.2.20 (2015-04-08)
===================

* bug fixes
* new demo application

0.2.19 (2015-04-08)
===================

* bug fixes

0.2.18 (2015-04-07)
===================

* bug fixes

0.2.17 (2015-04-07)
===================

* bug fixes

0.2.16 (2015-04-03)
===================

* bug fixes

0.2.15 (2015-03-27)
===================

* bug fixes


0.2.14 (2015-03-27)
===================

* add all modern structure

0.2.13 (2015-03-11)
===================

* use React 0.2.12 from npmjs.org (instead of bower version)

0.1.0 (2014-08-28)
==================

* Initial implementation.
