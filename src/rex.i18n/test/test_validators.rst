**********
Validators
**********

.. contents:: Table of Contents


LocaleVal
=========

The LocaleVal validator takes in a POSIX/RFC5646 locale identifier or a Babel
``Locale`` and normalizes it to a ``Locale``::

    >>> from rex.i18n import LocaleVal
    >>> validator = LocaleVal()

    >>> validator('en')
    Locale(u'en')
    >>> validator('en_GB')
    Locale(u'en', territory=u'GB')
    >>> validator('en_GB.UTF-8')
    Locale(u'en', territory=u'GB')
    >>> validator('en-GB')
    Locale(u'en', territory=u'GB')
    >>> validator('zh-Hans')
    Locale(u'zh', script=u'Hans')

    >>> validator('foobar')
    Traceback (most recent call last):
        ...
    Error: expected a POSIX or RFC5646 locale identifier, got 'foobar'

    >>> validator('blah(blah')
    Traceback (most recent call last):
        ...
    Error: expected a POSIX or RFC5646 locale identifier, got 'blah(blah'

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

