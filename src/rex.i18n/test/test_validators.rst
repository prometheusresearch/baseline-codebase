**********
Validators
**********

.. contents:: Table of Contents


LocaleVal
=========

The LocaleVal validator takes in a POSIX locale identifier or a Babel
``Locale`` and normalizes it to a ``Locale``::

    >>> from rex.i18n import LocaleVal
    >>> validator = LocaleVal()
    >>> validator('en')
    Locale('en')
    >>> validator('es_CO')
    Locale('es', territory='CO')
    >>> validator('foobar')
    Traceback (most recent call last):
        ...
    Error: expected a POSIX locale identifier, got 'foobar'

    >>> from babel import Locale
    >>> validator(Locale.parse('en'))
    Locale('en')


TimezoneVal
===========

The TimeoneVal validator takes in a Olsen Timzone name string or pytz
``timezone`` and normalizes it to a ``timezone``::

    >>> from rex.i18n import TimezoneVal
    >>> validator = TimezoneVal()
    >>> validator('UTC').zone
    'UTC'
    >>> validator('America/New_York').zone
    'America/New_York'
    >>> validator('foobar').zone
    Traceback (most recent call last):
        ...
    Error: expected an IANA TZ identifier, got 'foobar'

    >>> from pytz import timezone
    >>> validator(timezone('America/New_York')).zone
    'America/New_York'

