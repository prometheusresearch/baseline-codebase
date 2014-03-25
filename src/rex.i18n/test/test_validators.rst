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
    Error: unknown locale 'foobar'

    >>> from babel import Locale
    >>> validator(Locale.parse('en'))
    Locale('en')


TimezoneVal
===========

::

    >>> from rex.i18n import TimezoneVal
    >>> validator = TimezoneVal()
    >>> validator('UTC')
    <UTC>
    >>> validator('America/New_York')
    <DstTzInfo 'America/New_York' EST-1 day, 19:00:00 STD>
    >>> validator('foobar')
    Traceback (most recent call last):
        ...
    Error: expected an IANA TZ identifier, got 'foobar'

    >>> from pytz import timezone
    >>> validator(timezone('America/New_York'))
    <DstTzInfo 'America/New_York' EST-1 day, 19:00:00 STD>

