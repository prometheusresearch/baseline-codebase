**********
Extensions
**********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.i18n.extensions import *
    >>> from rex.core import Rex
    >>> from webob import Request
    >>> rex = Rex('rex.i18n', i18n_default_locale='en', i18n_supported_locales=['fr', 'en', 'en-GB'])
    >>> rex.on()


LocaleDetector
==============

The LocaleDetector extension allows applications to implement logic to
automatically lookup or calculate the locale to use for a given request.
Included in this package are the following::

    >>> LocaleDetector.all()
    [rex.i18n.extensions.SessionLocaleDetector, rex.i18n.extensions.AcceptLanguageLocaleDetector, rex.i18n.extensions.DefaultLocaleDetector]
    >>> LocaleDetector.mapped()
    {'session': rex.i18n.extensions.SessionLocaleDetector, 'accept-language': rex.i18n.extensions.AcceptLanguageLocaleDetector, 'default': rex.i18n.extensions.DefaultLocaleDetector}


SessionLocaleDetector
---------------------

This detector will return the locale that has been saved in the ``rex.web``
session, if one exists::

    >>> req = Request.blank('/')
    >>> req.environ['rex.session'] = {'i18n_locale': 'es'}
    >>> SessionLocaleDetector.detect_locale(req)
    Locale('es')

    >>> req.environ['rex.session'] = {'i18n_locale': 'fake'}
    >>> SessionLocaleDetector.detect_locale(req) is None
    True

    >>> del req.environ['rex.session']
    >>> SessionLocaleDetector.detect_locale(req) is None
    True


AcceptLanguageLocaleDetector
----------------------------

This detector will try to find the best locale to use based on what is in the
Accept-Language header sent by the browser::

    >>> req = Request.blank('/')
    >>> AcceptLanguageLocaleDetector.detect_locale(req) is None
    True

    >>> req.accept_language = 'fr,en;q=0.5,ar'
    >>> AcceptLanguageLocaleDetector.detect_locale(req)
    Locale('fr')

    >>> req.accept_language = 'en-GB,en;q=0.5'
    >>> AcceptLanguageLocaleDetector.detect_locale(req)
    Locale('en', territory='GB')


DefaultLocaleDetector
---------------------

This detector will return the default locale that is defined in the
application's settings::

    >>> req = Request.blank('/')
    >>> DefaultLocaleDetector.detect_locale(req)
    Locale('en')


TimezoneDetector
================

The TimezoneDetector extension allows applications to implement logic to
automatically lookup or calculate the timezone to use for a given request.
Included in this package are the following::

    >>> TimezoneDetector.all()
    [rex.i18n.extensions.SessionTimezoneDetector, rex.i18n.extensions.DefaultTimezoneDetector]
    >>> TimezoneDetector.mapped()
    {'session': rex.i18n.extensions.SessionTimezoneDetector, 'default': rex.i18n.extensions.DefaultTimezoneDetector}


SessionTimezoneDetector
-----------------------

This detector will return the timezone that has been saved in the ``rex.web``
session, if one exists::

    >>> req = Request.blank('/')
    >>> req.environ['rex.session'] = {'i18n_timezone': 'EST'}
    >>> SessionTimezoneDetector.detect_timezone(req)
    <StaticTzInfo 'EST'>

    >>> req.environ['rex.session'] = {'i18n_timezone': 'fake'}
    >>> SessionTimezoneDetector.detect_timezone(req) is None
    True

    >>> del req.environ['rex.session']
    >>> SessionTimezoneDetector.detect_timezone(req) is None
    True


DefaultTimezoneDetector
-----------------------

This detector will return the default timezone that is defined in the
application's settings::

    >>> req = Request.blank('/')
    >>> DefaultTimezoneDetector.detect_timezone(req)
    <UTC>



    >>> rex.off()

