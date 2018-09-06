***********
Initializer
***********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.core import Rex
    >>> from rex.web import get_jinja
    >>> app = Rex('__main__', 'rex.i18n', i18n_supported_locales=['en', 'fr', 'en-GB'])
    >>> app.on()
    >>> jinja = get_jinja()


The initializer will enable the Jinja i18n extension::

    >>> 'jinja2.ext.InternationalizationExtension' in jinja.extensions
    True


The initializer will inject a series of global variables into the Jinja
environment::

    >>> jinja.globals['CURRENT_LOCALE'] == 'en'
    True
    >>> jinja.globals['CURRENT_LOCALE_DIRECTION'] == 'ltr'
    True
    >>> jinja.globals['CURRENT_LOCALE_LTR'] == True
    True
    >>> jinja.globals['CURRENT_LOCALE_RTL'] == False
    True
    >>> jinja.globals['CURRENT_TIMEZONE'] == 'UTC'
    True
    >>> supported = jinja.globals['SUPPORTED_LOCALES']
    >>> len(supported) == 3
    True
    >>> supported[0][0] == 'en'
    True
    >>> supported[0][1] == 'English'
    True
    >>> supported[2][0] == 'en-GB'
    True
    >>> supported[2][1] == 'English (United Kingdom)'
    True


The SUPPORTED_LOCALES global variable is a list wrapper that handles the lazy
translation of locale names, as well as pseudo-dictionary-like access::

    >>> supported['en'] == 'English'
    True
    >>> supported['es']
    Traceback (most recent call last):
        ...
    KeyError: 'es'
    >>> supported['foo']
    Traceback (most recent call last):
        ...
    KeyError: 'foo'
    >>> list(supported)
    [('en', 'English'), ('fr', 'French (fran\xe7ais)'), ('en-GB', 'English (United Kingdom)')]
    >>> supported
    (('en', 'English'), ('fr', 'French (fran\xe7ais)'), ('en-GB', 'English (United Kingdom)'))


The initializer will inject a series of filters into the Jinja environment::

    >>> from rex.i18n import filters
    >>> for name in sorted(filters.__all__):
    ...     if name in jinja.filters and callable(jinja.filters[name]):
    ...         print(name)
    ...     else:
    ...         print('%s IS MISSING!' % name)
    format_currency
    format_date
    format_datetime
    format_decimal
    format_number
    format_percent
    format_scientific
    format_time
    format_timedelta


