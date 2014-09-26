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
* Provides a JavaScript module to provide the same level of translation and
  localization support to JavaScript applications as is available to pure
  Python/Jinja applications.

.. _gettext: https://www.gnu.org/software/gettext/

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Localizing Python Code
======================

To localize the strings that may be embedded in your Python code, you simply
wrap the string in a call to the gettext function. So, the following code::

    text = "Hello %(name)s" % {'name': some_variable}

Becomes::

    from rex.i18n import gettext as _

    text = _("Hello %(name)s", name=some_variable)


Pluralized strings change from::

    if num == 1:
        text = "%s apple" % num
    else:
        text = "%s apples" % num

To::

    from rex.i18n import ngettext

    text = ngettext("%(num)s apple", "%(num)s apples", num)


Localizing Jinja Templates
==========================

To localize the strings that are embedded in your Jinja templates, you have two
tools available to you; calling the ``_``, ``gettext``, or ``ngettext``
functions as part of ``{{ }}`` expressions, or by using the ``{% trans %}``
block tags. These tools are included as part of Jinja and are well documented
in the `Jinja Documentation`_

.. _`Jinja Documentation`: http://jinja.pocoo.org/docs/dev/templates/#i18n-in-templates

This package make available a number of filters that you can use to format
numbers, dates, and times according to the user's locale. These filters are:

* format_number
* format_decimal
* format_currency
* format_percent
* format_scientific
* format_datetime
* format_date
* format_time
* format_timedelta

So, to format a number, you'd do something along the lines of::

    {{ some_variable|format_number }}

Formatting a date would be like::

    {{ a_date_variable|formate_date }}

See the API documentation for details about additional optional parameters
these filters will accept.

This package will also inject a series of variables into the Jinja context that
you can use in your templates:

``CURRENT_LOCALE``
    This is a string that indicates the locale that is currently in use for the
    request.

``CURRENT_LOCALE_DIRECTION``
    This is a string that indicates what direction the script defined by the
    locale uses. Most locales will have a direction of ``ltr``, indicating
    left-to-right, but some languages (such as Arabic) will have a direction of
    ``rtl``, indicating right-to-left.

``CURRENT_LOCALE_LTR``
    This is a boolean that indicates whether or not the current locale uses a
    left-to-right script.

``CURRENT_LOCALE_RTL``
    This is a boolean that indicates whether or not the current locale uses a
    right-to-left script.

``CURRENT_TIMEZONE``
    This is a string that indicagtes the timezone that is currently in use for
    the request.

``SUPPORTED_LOCALES``
    This is a list-like object that contains a series of tuples that indicate
    what locales the current application instance support. These tuples have
    two elements; the first is the locale identifier, the second is the name of
    the locale *translated into the language that the locale represents*.


Localizing JavaScript Code
==========================

The JavaScript module included in this package exposes an object named
``RexI18N``. This object, when initialized with the desired locale, will load
the necessary information from the server and expose functions that can be used
in your code to perform various localization tasks.

To translate strings, the object has ``gettext`` and ``ngettext`` methods. To
format date/time values, the object has ``formatDate``, ``formatTime``, and
``formatDateTime`` methods. To format numeric values, the object has
``formatNumber``, ``formatDecimal``, and ``formatPercent`` methods. See the API
documentation for more details on the options these methods will accept.

Note that there is a Jinja macro named ``setup`` in the
``rex.i18n:/template/macros.html`` file that will set up the default
configuration of the ``RexI18N`` object that can be used in simpler situations.
Be sure to use this macro before any JavaScript bundles from RexDB applications
are imported.


Settings
========

``i18n_default_locale``
    This setting accepts a string in the format of a POSIX locale identifier.
    It specifies what locale should be used in situations where one is not
    specified or cannot be detected. If this setting is not specified, it
    defaults to ``en``.

``i18n_default_timezone``
    This setting accepts a string in the format of an IANA Time Zone Database
    identifier. It specifies what timezone should be used in situations where
    one is not specified or cannot be detected. If this setting is not
    specified, it defaults to ``UTC``.

``i18n_supported_locales``
    This setting accepts a list of POSIX locale identifier strings. It
    specifies what languages are allowed to be used in the application. It
    should always include the locale defined for the ``i18n_default_locale``
    setting. If this setting is not specified, it defaults to ``['en']``.


Command Line Tools
==================

This package contains a series of command line tools (exposed via ``rex.ctl``):


i18n-extract
------------

This command will scan a project's source files and extract the strings marked
for translation and put them into the appropriate gettext POT files. These
files are stored in the ``i18n`` directory within the project's static file
directory.

By default it will process both gettext domains that this package establishes;
``backend`` and ``frontend``. If necessary, you can explicitly choose which
domain to extract by using the ``--domain`` option.

Example::

    $ rex i18n-extract rex.survey
    extracting messages from ...
    writing PO template file to rex.survey/i18n/backend.pot
    extracting messages from ...
    writing PO template file to rex.survey/i18n/frontend.pot


i18n-init
---------

This command will create the initial skeleton gettext PO files for the
specified locale. It will base those skeletons off of the POT files that exist
in the project (which means that the ``i18n-extract`` command must have been
used at least once prior to using this command).

By default it will process both gettext domains that this package establishes;
``backend`` and ``frontend``. If necessary, you can explicitly choose which
domain to extract by using the ``--domain`` option.

Example::

    $ rex i18n-init rex.survey it
    creating catalog 'rex.survey/i18n/it/LC_MESSAGES/backend.po' based on 'rex.survey/i18n/backend.pot'
    creating catalog 'rex.survey/i18n/it/LC_MESSAGES/frontend.po' based on 'rex.survey/i18n/frontend.pot'


i18n-update
-----------

This command will update the gettext PO files in the project using its updated
POT files. Frequently, after a series PO files have been initially created
using the ``i18n-init`` command, more strings may be added to the project's
source files. When this happens, you'll need to execute the ``i18n-extract``
command to update the base POT files for the project, and then using this
command to then update the individual locales' PO files.

By default, this command will update all locales found in the project. If
necessary, you can choose a specific locale to update by passing that locale
as an additional argument to the command.

By default it will process both gettext domains that this package establishes;
``backend`` and ``frontend``. If necessary, you can explicitly choose which
domain to extract by using the ``--domain`` option.

Example::

    $ rex i18n-update rex.survey it
    updating catalog 'rex.survey/i18n/it/LC_MESSAGES/backend.po' based on 'rex.survey/i18n/backend.pot'
    updating catalog 'rex.survey/i18n/it/LC_MESSAGES/frontend.po' based on 'rex.survey/i18n/frontend.pot'


i18n-compile
------------

This command will compile all the gettext PO files in a project to their MO
file equivalents. These MO files are what are actually used by the framework to
perform translations during runtime, so this command must at the very least be
executed prior to packaging the project for distribution/deployment.

By default, this command will compile all locales found in the project. If
necessary, you can choose a specific locale to compile by passing that locale
as an additional argument to the command.

By default it will process both gettext domains that this package establishes;
``backend`` and ``frontend``. If necessary, you can explicitly choose which
domain to extract by using the ``--domain`` option.

Example::

    $ rex i18n-compile rex.survey it
    compiling catalog 'rex.survey/i18n/it/LC_MESSAGES/backend.po' to 'rex.survey/i18n/it/LC_MESSAGES/backend.mo'
    compiling catalog 'rex.survey/i18n/it/LC_MESSAGES/frontend.po' to 'rex.survey/i18n/it/LC_MESSAGES/frontend.mo'


Typical Development Workflow
============================

In general, the the basic flow for developing localized applications is
outlined below. Each of these steps may be performed in slightly different
manners depending on the environment or toolset implemented by your team, but
the basic order of operations will remain the same.

1. Code is written using the string-handling methods mentioned in this
   document (e.g., using the various implementations of the
   ``_``/``gettext``/``ngettext`` functions).

2. After development reaches some stable point, the strings should be extracted
   from the source files using the ``i18n-extract`` command provided by this
   package.

3. Using the freshly created and/or updated POT files, PO files for the
   desired locales should be created or updated. This is done by using the
   ``i18n-init`` or ``i18n-update`` commands, respectively.

4. The PO files should then be edited to add the necessary translations.

5. Prior to running the application, or packaging it for distribution, the PO
   files need to be compiled into MO files. This is done by using the
   ``i18n-compile`` command provided by this package.


Gettext Files
=============

The gettext POT, PO, and MO files for a project are stored in its static file
directory. An example of the file layout is as follows::

    my.project/
        static/
            i18n/
                fr/
                    backend.po
                    backend.mo
                    frontend.po
                    frontend.mo
                es/
                    backend.po
                    backend.mo
                    frontend.po
                    frontend.mo
                backend.pot
                frontend.pot

The POT and PO files should always be committed into your project's source
repository. MO files typically aren't commited into source repositories, but
may need to be depending on the building/packaging processes that your team
follows.

For more information on these files, their format, and their use, please read
the `Gettext documentation`_.

.. _`Gettext documentation`: https://www.gnu.org/software/gettext/manual/html_node/index.html


CLDR Data
=========

This package makes use of data from the `Unicode Common Locale Data
Repository`_ (CLDR) to peform localization of dates/times, numbers, and
currencies. For more information about this project, visit their site.

.. _`Unicode Common Locale Data Repository`: http://cldr.unicode.org/

