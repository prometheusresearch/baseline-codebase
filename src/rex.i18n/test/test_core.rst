****
Core
****

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.i18n.core import *
    >>> from rex.core import Rex
    >>> from webob import Request
    >>> rex = Rex('rex.i18n_demo', i18n_default_locale='fr', i18n_supported_locales=['en', 'fr'])
    >>> rex.on()


get_locale
==========

This function will retrieve the locale that is being used on the current
thread::

    >>> get_locale()
    Locale('fr')


get_locale_direction
====================

This function will retrieve the directionality of the script used in the
specified locale::

    >>> get_locale_direction()
    'ltr'

    >>> get_locale_direction(get_locale())
    'ltr'

    >>> get_locale_direction('ar')
    'rtl'


get_timezone
============

This function will retrieve the timezone that is being used on the current
thread::

    >>> get_timezone()
    <UTC>


get_translations
================

This function returns the Translations object that contains all the string
translations for the current locale::

    >>> get_translations()
    <Translations: "rex.i18n_demo 1.0.0">


get_json_translations
=====================

This function will return a JSON-encoded version of a Translations object
suitable for use by client-side JavaScript libraries::

    >>> get_json_translations('fr', 'backend')
    {'backend': {'': {'lang': 'fr', 'domain': 'backend', 'plural_forms': 'nplurals=2; plural=(n > 1)'}, u'apple': [None, u'pomme'], u'%(num)s banana': [None, u'%(num)s banane', u'%(num)s bananes']}}


gettext
=======

This function performs a string translation based on the current locale::

    >>> gettext('apple')
    u'pomme'

    >>> gettext("doesn't exist")
    u"doesn't exist"


ngettext
========

This function performs pluralized string translations based on the current
locale::


    >>> ngettext('%(num)s banana', '%(num)s bananas', 1)
    u'1 banane'

    >>> ngettext('%(num)s banana', '%(num)s bananas', 5)
    u'5 bananes'

    >>> ngettext('%(num)s cocounts', '%(num)s coconuts', 3)
    u'3 coconuts'



    >>> rex.off()

