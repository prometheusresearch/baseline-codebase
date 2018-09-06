********
Commands
********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.core import Rex
    >>> from webob import Request
    >>> rex = Rex('rex.i18n', i18n_supported_locales=['en', 'fr', 'fil', 'en-GB'])
    >>> rex.on()

Make sure all the Commands are available::

    >>> from rex.web import Command
    >>> for signature, impl in Command.mapped().items():
    ...     if signature.startswith('i18n'):
    ...         print('%s: %s' % (signature, impl))
    i18n_switch_locale: rex.i18n.commands.SwitchLocaleCommand
    i18n_translations: rex.i18n.commands.GetTranslationsCommand
    i18n_locales: rex.i18n.commands.GetActiveLocalesCommand


SwitchLocale
============

This command requires that you provide a ``locale`` parameter::

    >>> req = Request.blank('/switch')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...

When you provide a valid ``locale`` parameter, it will redirect you to the root
of the current server::

    >>> req = Request.blank('/switch', POST={'locale': 'fr'})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    302 Found
    X-RexI18N-Locale: fr
    ...
    Location: http://localhost/
    ...

If you provide a locale that is not registered in the
``i18n_supported_locales`` setting, you get an error::

    >>> req = Request.blank('/switch', POST={'locale': 'es'})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...

You can provide a ``redirect`` parameter to tell it where to redirect you to::

    >>> req = Request.blank('/switch', POST={'locale': 'en-GB', 'redirect': 'http://google.com'})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    302 Found
    X-RexI18N-Locale: en-GB
    ...
    Location: http://google.com
    ...

If you don't provide a ``redirect`` parameter, it will send you back to the URL
noted in your Referer header::

    >>> req = Request.blank('/switch', POST={'locale': 'fr'}, referer='http://yahoo.com')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    302 Found
    X-RexI18N-Locale: fr
    ...
    Location: http://yahoo.com
    ...

In addition to POST, this Command can operate via GET::

    >>> req = Request.blank('/switch?locale=fr&redirect=http://google.com')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    302 Found
    X-RexI18N-Locale: fr
    ...
    Location: http://google.com
    ...


GetTranslations
===============

The GetTranslations command will return the JSON-ified gettext configuration
for the "frontend" domain for the given locale::

    >>> req = Request.blank('/translations/en')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    Last-Modified: ...
    Set-Cookie: ...
    <BLANKLINE>

    {"frontend": {"": {"lang": "en", "domain": "frontend", "plural_forms": "nplurals=2; plural=(n != 1)"}}}

If you specify a locale that is not configured in the system, you will receive
a 400 error::

    >>> req = Request.blank('/translations/ar')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    400 Bad Request
    ...


GetActiveLocales
================

The GetActiveLocales command will return a JSON object containing the
locales supported by the application::

    >>> req = Request.blank('/locale/active')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    Content-Type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"active": "en", "default": "en", "available": [{"id": "en", "name": {"native": "English", "default": "English", "current": "English"}}, {"id": "fr", "name": {"native": "français", "default": "French", "current": "French"}}, {"id": "fil", "name": {"native": "Filipino", "default": "Filipino", "current": "Filipino"}}, {"id": "en-GB", "name": {"native": "English (United Kingdom)", "default": "English (United Kingdom)", "current": "English (United Kingdom)"}}]}



    >>> rex.off()


