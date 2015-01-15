**********
Extensions
**********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.i18n.extensions import *
    >>> from rex.core import Rex
    >>> from webob import Request
    >>> rex = Rex('rex.i18n', i18n_default_locale='en', i18n_supported_locales=['en', 'fr'])
    >>> rex.on()


BabelMapper
===========

The BabelMapper extension allows applications to provide the necessary Babel
configuration used in extracting translatable strings from source files.
Included in this package are the following::

    >>> BabelMapper.all()
    [rex.i18n.extensions.CoreBabelMapper, rex.i18n.extensions.WebBabelMapper, rex.i18n.extensions.JavaScriptBabelMapper]
    >>> BabelMapper.mapped()
    {'python': rex.i18n.extensions.CoreBabelMapper, 'temmplate': rex.i18n.extensions.WebBabelMapper, 'javascript': rex.i18n.extensions.JavaScriptBabelMapper}


The base class has a method that will generate the full configuration for a
specified gettext domain::

    >>> print BabelMapper.domain_mapper_config('backend')
    [python: src/**.py]
    [jinja2: static/template/**.html]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols
    [jinja2: static/templates/**.html]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols
    [jinja2: static/www/**.html]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols
    [jinja2: static/www/**.js_t]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols
    [jinja2: static/www/**.css_t]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols

    >>> print BabelMapper.domain_mapper_config('frontend')
    [jsx: static/js/lib/**.js]
    [jsx: static/js/lib/**.jsx]


CoreBabelMapper
---------------

This mapper produces the configuration for scanning Python source files::

    >>> CoreBabelMapper.domain
    'backend'
    >>> print CoreBabelMapper.mapper_config()
    [python: src/**.py]


WebBabelMapper
--------------

This mapper produces the configuration for scanning Jinja2 templates::

    >>> WebBabelMapper.domain
    'backend'
    >>> print WebBabelMapper.mapper_config()
    [jinja2: static/template/**.html]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols
    [jinja2: static/templates/**.html]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols
    [jinja2: static/www/**.html]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols
    [jinja2: static/www/**.js_t]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols
    [jinja2: static/www/**.css_t]
    extensions=jinja2.ext.do,jinja2.ext.loopcontrols


JavaScriptBabelMapper
---------------------

This mapper produces the configuration for scanning JavaScript source files::

    >>> JavaScriptBabelMapper.domain
    'frontend'
    >>> print JavaScriptBabelMapper.mapper_config()
    [jsx: static/js/lib/**.js]
    [jsx: static/js/lib/**.jsx]


LocaleDetector
==============

The LocaleDetector extension allows applications to implement logic to
automatically lookup or calculate the locale to use for a given request.
Included in this package are the following::

    >>> LocaleDetector.all()
    [rex.i18n.extensions.SessionLocaleDetector, rex.i18n.extensions.AcceptLanguageLocaleDetector, rex.i18n.extensions.DefaultLocaleDetector]
    >>> LocaleDetector.mapped()
    {'default': rex.i18n.extensions.DefaultLocaleDetector, 'session': rex.i18n.extensions.SessionLocaleDetector, 'accept-language': rex.i18n.extensions.AcceptLanguageLocaleDetector}


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
    >>> AcceptLanguageLocaleDetector.detect_locale(req)
    Locale('en')

    >>> req.accept_language = 'fr, en;q=0.5, ar'
    >>> AcceptLanguageLocaleDetector.detect_locale(req)
    Locale('fr')


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
    {'default': rex.i18n.extensions.DefaultTimezoneDetector, 'session': rex.i18n.extensions.SessionTimezoneDetector}


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

