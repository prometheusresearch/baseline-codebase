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
    Locale(u'fr')


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

    >>> get_locale_direction('en-GB')
    'ltr'



get_locale_identifier
=====================

This function will return the identifier string for the given locale object::

    >>> from babel import Locale

    >>> get_locale_identifier()
    'fr'

    >>> get_locale_identifier(Locale('en', 'GB'))
    'en-GB'
    >>> get_locale_identifier(Locale('en', 'GB'), sep='_')
    'en_GB'


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

    >>> tx = get_translations()
    >>> tx
    <RexTranslations: "rex.i18n_demo 0.5.0">
    >>> tx.domain
    'backend'

    >>> tx = get_translations('es', 'frontend')
    >>> tx
    <RexTranslations: "rex.i18n_demo 0.5.0">
    >>> tx.domain
    'frontend'


get_json_translations
=====================

This function will return a JSON-encoded version of a Translations object
suitable for use by client-side JavaScript libraries::

    >>> get_json_translations('fr', 'backend')
    {'backend': {'': {'lang': 'fr', 'domain': 'backend', 'plural_forms': 'nplurals=2; plural=(n > 1)'}, u'apple': [u'pomme'], u'%(num)s banana': [u'%(num)s banane', u'%(num)s bananes']}}

    >>> get_json_translations('es', 'backend')
    {'backend': {'': {'lang': 'es', 'domain': 'backend', 'plural_forms': 'nplurals=2; plural=(n != 1)'}, u'apple': [''], u'%(num)s banana': [u'%(num)s banana', u'%(num)s bananas']}}


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


lazy_gettext
============

This function returns an object that acts as if it were as string, but does not
perform the translation until the last moment::

    >>> lazy_string = lazy_gettext('apple')
    >>> repr(lazy_string)
    "lu'pomme'"
    >>> str(lazy_string)
    'pomme'
    >>> '%s' % lazy_string
    'pomme'


RexTranslations
===============

The RexTranslations class is used by the internals of ``rex.i18n`` to read and
merge the gettext files in an application. It is unlikely that you will need to
use this class directly::

    >>> from rex.core import get_packages
    >>> translations_dir = get_packages()['rex.i18n_demo'].abspath('test_i18n_files')
    >>> def dump_catalog(trans):
    ...     for key in sorted(trans._catalog.keys()):
    ...         if key:
    ...             print('%s: %s' % (key, trans._catalog[key]))

    >>> fr_translations = RexTranslations.load(translations_dir, 'fr', 'test')
    >>> dump_catalog(fr_translations)
    bar: french bar
    baz: baz
    foo: french foo

    >>> es_translations = RexTranslations.load(translations_dir, 'es', 'test')
    >>> dump_catalog(es_translations)
    bar: bar
    baz: spanish baz
    foo: spanish foo
    foobar: spanish foobar

    >>> merged_translations = fr_translations.merge(es_translations)
    >>> dump_catalog(merged_translations)
    bar: french bar
    baz: spanish baz
    foo: spanish foo
    foobar: spanish foobar



    >>> rex.off()


