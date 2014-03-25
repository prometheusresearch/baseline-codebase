*******
Filters
*******

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.i18n import filters
    >>> from rex.core import Rex
    >>> app_en = Rex('__main__', 'rex.i18n')
    >>> app_fr = Rex('__main__', 'rex.i18n', i18n_default_locale='fr', i18n_default_timezone='Europe/Vienna')


Numbers
=======

The numerical-oriented filters will format numbers into strings according to
the currently active locale::

    >>> app_en.on()
    >>> filters.format_number(123456)
    u'123,456'
    >>> filters.format_decimal(123456.789)
    u'123,456.789'
    >>> filters.format_currency(123456.789, 'USD')
    u'$123,456.79'
    >>> filters.format_currency(123456.789, 'EUR')
    u'\u20ac123,456.79'
    >>> filters.format_percent(0.7823)
    u'78%'
    >>> filters.format_scientific(1234567)
    u'1E6'
    >>> app_en.off()

    >>> app_fr.on()
    >>> filters.format_number(123456)
    u'123\xa0456'
    >>> filters.format_decimal(123456.789)
    u'123\xa0456,789'
    >>> filters.format_currency(123456.789, 'USD')
    u'123\xa0456,79\xa0$US'
    >>> filters.format_currency(123456.789, 'EUR')
    u'123\xa0456,79\xa0\u20ac'
    >>> filters.format_percent(0.7823)
    u'78\xa0%'
    >>> filters.format_scientific(1234567)
    u'1E6'
    >>> app_fr.off()


Dates/Times
===========

The numerical-oriented filters will format dates into strings according to both
the currently active locale and currently active timezone::

    >>> import datetime
    >>> d = datetime.datetime(2010, 4, 12, 13, 46)
    >>> td = datetime.timedelta(hours=2)

    >>> app_en.on()
    >>> filters.format_datetime(d)
    u'Apr 12, 2010, 1:46:00 PM'
    >>> filters.format_date(d)
    u'Apr 12, 2010'
    >>> filters.format_time(d)
    u'1:46:00 PM'
    >>> filters.format_timedelta(d)
    u'4 years'
    >>> filters.format_timedelta(td)
    u'2 hours'
    >>> app_en.off()

    >>> app_fr.on()
    >>> filters.format_datetime(d)
    u'12 avr. 2010 15:46:00'
    >>> filters.format_date(d)
    u'12 avr. 2010'
    >>> filters.format_time(d)
    u'15:46:00'
    >>> filters.format_timedelta(d)
    u'4 ann\xe9es'
    >>> filters.format_timedelta(td)
    u'2 heures'
    >>> app_fr.off()

