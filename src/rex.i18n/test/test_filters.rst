*******
Filters
*******

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.i18n import filters, get_i18n_context
    >>> ctx = get_i18n_context()


Numbers
=======

The numerical-oriented filters will format numbers into strings according to
the currently active locale::

    >>> from babel import Locale
    >>> en = Locale('en')
    >>> fr = Locale('fr')

    >>> ctx.set_locale(en)
    >>> filters.format_number(123456)
    '123,456'
    >>> filters.format_decimal(123456.789)
    '123,456.789'
    >>> filters.format_currency(123456.789, 'USD')
    '$123,456.79'
    >>> filters.format_currency(123456.789, 'EUR')
    '\u20ac123,456.79'
    >>> filters.format_percent(0.7823)
    '78%'
    >>> filters.format_scientific(1234567)
    '1.234567E6'
    >>> ctx.reset()

    >>> ctx.set_locale(fr)
    >>> filters.format_number(123456)
    '123\u202f456'
    >>> filters.format_decimal(123456.789)
    '123\u202f456,789'
    >>> filters.format_currency(123456.789, 'USD')
    '123\u202f456,79\xa0$US'
    >>> filters.format_currency(123456.789, 'EUR')
    '123\u202f456,79\xa0€'
    >>> filters.format_percent(0.7823)
    '78\xa0%'
    >>> filters.format_scientific(1234567)
    '1,234567E6'
    >>> ctx.reset()


Dates/Times
===========

The numerical-oriented filters will format dates into strings according to both
the currently active locale and currently active timezone::

    >>> from pytz import timezone
    >>> utc = timezone('UTC')
    >>> vienna = timezone('Europe/Vienna')

    >>> import datetime
    >>> dt = datetime.datetime(2010, 4, 12, 13, 46)
    >>> dt2 = datetime.datetime(2010, 4, 12, 13, 46, tzinfo=vienna)
    >>> td = datetime.timedelta(hours=2)
    >>> d = datetime.date(2014, 5, 22)

    >>> ctx.set_locale(en)
    >>> ctx.set_timezone(utc)
    >>> filters.format_datetime(dt)
    'Apr 12, 2010, 1:46:00 PM'
    >>> filters.format_datetime(dt2)
    'Apr 12, 2010, 12:41:00 PM'
    >>> filters.format_date(dt)
    'Apr 12, 2010'
    >>> filters.format_date(dt2)
    'Apr 12, 2010'
    >>> filters.format_date(d)
    'May 22, 2014'
    >>> filters.format_time(dt)
    '1:46:00 PM'
    >>> filters.format_timedelta(dt).endswith(' years')
    True
    >>> filters.format_timedelta(td)
    '2 hours'
    >>> ctx.reset()

    >>> ctx.set_locale(fr)
    >>> ctx.set_timezone(vienna)
    >>> filters.format_datetime(dt)
    '12 avr. 2010 \xe0 15:46:00'
    >>> filters.format_datetime(dt2)
    '12 avr. 2010 \xe0 14:41:00'
    >>> filters.format_date(dt)
    '12 avr. 2010'
    >>> filters.format_date(dt2)
    '12 avr. 2010'
    >>> filters.format_date(d)
    '22 mai 2014'
    >>> filters.format_time(dt)
    '15:46:00'
    >>> filters.format_timedelta(dt).endswith(' ans')
    True
    >>> filters.format_timedelta(td)
    '2\xa0heures'
    >>> ctx.reset()

