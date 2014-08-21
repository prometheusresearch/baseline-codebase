********
Commands
********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.core import Rex
    >>> from webob import Request
    >>> rex = Rex('rex.i18n', i18n_supported_locales=['en', 'fr'])
    >>> rex.on()


SwitchLocale
============

This command requires that you provide a ``locale`` parameter::

    >>> req = Request.blank('/switch')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...

When you provide a valid ``locale`` parameter, it will redirect you to the root
of the current server::

    >>> req = Request.blank('/switch', method='POST')
    >>> req.POST['locale'] = 'fr'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    302 Found
    X-RexI18N-Locale: fr
    ...
    Location: http://localhost/
    ...

If you provide a locale that is not registered in the
``i18n_supported_locales`` setting, you get an error::

    >>> req = Request.blank('/switch', method='POST')
    >>> req.POST['locale'] = 'es'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...

You can provide a ``redirect`` parameter to tell it where to redirect you to::

    >>> req = Request.blank('/switch', method='POST')
    >>> req.POST['locale'] = 'fr'
    >>> req.POST['redirect'] = 'http://google.com'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    302 Found
    X-RexI18N-Locale: fr
    ...
    Location: http://google.com
    ...

If you don't provide a ``redirect`` parameter, it will send you back to the URL
noted in your Referer header::

    >>> req = Request.blank('/switch', method='POST', referer='http://yahoo.com')
    >>> req.POST['locale'] = 'fr'
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    302 Found
    X-RexI18N-Locale: fr
    ...
    Location: http://yahoo.com
    ...

In addition to POST, this Command can operate via GET::

    >>> req = Request.blank('/switch?locale=fr&redirect=http://google.com')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
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
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    {"frontend": {"": {"lang": "en", "domain": "frontend", "plural_forms": "nplurals=2; plural=(n != 1)"}}}

If you specify a locale that is not configured in the system, you will receive
a 400 error::

    >>> req = Request.blank('/translations/ar')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...


GetLocaleCommon
===============

The GetLocaleCommon command will return a JSON array containing the common
portions of the CLDR data used by all locales::

    >>> req = Request.blank('/locale')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    ...


GetLocaleDetail
===============

The GetLocaleDetail command will return a JSON array containing the
locale-specific portions of the CLDR data::

    >>> req = Request.blank('/locale/en')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    200 OK
    Content-type: application/json
    Content-Length: ...
    Set-Cookie: ...
    <BLANKLINE>
    ...

If you specify a locale that is not configured in the system, you will receive
a 400 error::

    >>> req = Request.blank('/locale/ar')
    >>> print req.get_response(rex)  # doctest: +ELLIPSIS
    400 Bad Request
    ...



    >>> rex.off()

