*******************
REX.I18N Change Log
*******************

.. contents:: Table of Contents


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

