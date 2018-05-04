*******************
REX.I18N Change Log
*******************

.. contents:: Table of Contents


0.5.5 (2018-05-04)
==================

* Enhanced the ``gettext`` and ``ngettext`` JavaScript functions to support
  formatting codes for numbers, percentages, currencies, and dates/times in a
  way that internationalizes those values when they are inserted into the
  string.


0.5.4 (2018-01-03)
==================

* Test fixes.


0.5.3 (2017-06-20)
==================

* Fixes to support ``rex.setup`` v4.


0.5.2 (2017-01-19)
==================

* Fixed an issue that caused the AcceptsLanguageLocaleDetector to always
  identify a locale, even when the header didn't exist.
* Fixed/Refactored the set_locale()/set_timezone() APIs so that it's easier to
  update the current session.


0.5.1 (2016-10-11)
==================

* Fixed an issue that caused a crash when trying to validate particular strings
  as Locales.


0.5.0 (2016-08-12)
==================

* Removed the embedded CLDR dataset.
* Removed the ``/locale`` and ``/locale/{locale}`` web APIs.
* Refactored the base JavaScript I18N class library. It is now based on a
  combination of the Intl API and the moment library, rather than the
  Globalize library.
* Added a collection of React components to facilitate integration with React-
  based apps.
* Implemented a simplistic demo application to show usage of the React
  components.
* Removed the ``setup()`` Jinja macro and added a ``polyfill()`` macro.
* Rewrote the string extraction process for JavaScript code.


0.4.5 (2015-11-18)
==================

* Fixed an issue where extracting strings from Jinja templates with invalid
  syntax would silently fail.


0.4.4 (2015-09-30)
==================

* Updated tools for JavaScript string extraction.


0.4.3 (2015-06-23)
==================

* Added compatibility with ``rex.setup`` v3.


0.4.2 (2015-06-12)
==================

* Numerous fixes to better support regional language variations (e.g., "en" vs
  "en-GB", etc).
* The i18n-extract command will now extract strings from any type of file in
  the /static/template or /static/templates directories.


0.4.1 (2015-02-20)
==================

* Fixed a JavaScript string translation issue by pinning an exact version of a
  dependency.


0.4.0 (2015-01-30)
==================

* Added a JSON API that allows the retrieval of the current and available
  locales in the system.
* Pinned working version of PyExecJS to fix crashes when extracting strings
  from JSX files.
* Updated integration with ``rex.web`` to use new ``Pipe`` interface. This
  package now requires >=3.1 of ``rex.web``.
* Added support for ``rex.setup`` v2.
* Upgraded to v2 of ``rex.ctl``. In doing so, the arguments/options to the
  i18n-* commands have been altered slightly.
* The ``BabelMapper`` extension has been removed. It is no longer possible to
  add custom string extractors to your projects.


0.3.0 (9/26/2014)
=================

* Reworked bower dependencies to ease integration into other RexDB JS packages.
* Added some convenience functions to help downstream packages load and use
  the JavaScript components.
* Added a Jinja macro that performs the "normal" initialization of the JS
  package on a page.
* Fixed issue of locale/timezone globals not actually being thread-safe.
* Added support for rex.web v3.
* Added some initial documentation about the package and how to use it.
* Fixed an issue where translated strings from one package could be overridden
  by untranslated versions of the same strings from other packages in the
  application.
* Fixed an issue with the JavaScript package not correctly translating
  singular strings for locales with uncommon plural forms rules (e.g., Arabic).
* Fixed an issue where JSX-formatted files would sometimes not have all their
  strings extracted from them with the ``i18n-extract`` command.


0.2.0 (8/25/2014)
=================

* Fixed an issue where some Jinja templates were being missed during
  extraction.
* PO file compilation no longer crashes if there are problems with just one
  domain.
* Added some caching functionality to the commands that serve data to the JS
  library, as well as enhanced some of their error handling.
* Removed dependency on polib and rewrote JSON gettext converter.


0.1.0 (7/3/2014)
================

* Initial implementation

