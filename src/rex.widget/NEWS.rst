**************
  Change Log
**************

1.5.0 (2015-XX-XX)
==================

* New Chrome widget feature. Allows to specify a widget which wraps every
  top-level widget in an application. Can be used to implement app-wide UI
  features like navigation bars, footers and so on.


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
