**************************
REX.I18N Programming Guide
**************************

.. contents:: Table of Contents


Overview
========

This package contains a collection of utilities to facilitate the
Internationalization (I18N) and Localization (L10N) of RexDB applications.

* It enhances ``rex.web`` and Jinja with gettext_ translation support and
  several filters for the localization of numbers, dates, etc.
* Adds an automatic and extensible means for identifying the desired locale of
  the current user. There is also a reusable Command to facilitate easy
  switching between locales.
* Provides a series of ``rex.ctl`` tasks to aid in managing the gettext files
  for an application.
* (**STILL IN PROGRESS**) Provides a JavaScript module to provide the same
  level of translation and localization support to JavaScript applications as
  is available to pure Python/Jinja applications.

.. _gettext: https://www.gnu.org/software/gettext/

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign

