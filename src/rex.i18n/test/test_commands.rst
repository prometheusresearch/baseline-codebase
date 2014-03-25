********
Commands
********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.core import Rex
    >>> from webob import Request
    >>> rex = Rex('rex.i18n', i18n_supported_locales=['en', 'fr'])


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

