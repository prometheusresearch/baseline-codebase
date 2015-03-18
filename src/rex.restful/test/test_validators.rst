**********
Validators
**********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.restful.validators import *
    >>> from datetime import datetime, date, time
    >>> TEST_DATE = date(2015, 1, 1)
    >>> TEST_DATETIME = datetime(2015, 1, 1, 12, 34, 56, 789)
    >>> TEST_TIME = time(12, 34, 56, 789)


DateVal
=======

DateVal accepts ISO8601-formatted date strings, as well as ``date`` and
``datetime`` objects. All are coerced to a ``date`` object::

    >>> date_val = DateVal()
    >>> date_val
    DateVal()
    >>> date_val(TEST_DATE)
    datetime.date(2015, 1, 1)
    >>> date_val(TEST_DATETIME)
    datetime.date(2015, 1, 1)
    >>> date_val('2015-01-01')
    datetime.date(2015, 1, 1)

    >>> date_val('2015-02-30')
    Traceback (most recent call last):
        ...
    Error: Expected a valid date in the format YYYY-MM-DD
    Got:
        '2015-02-30'

    >>> date_val('foobar')
    Traceback (most recent call last):
        ...
    Error: Expected a valid date in the format YYYY-MM-DD
    Got:
        'foobar'

    >>> date_val(123)
    Traceback (most recent call last):
        ...
    Error: Expected a valid date in the format YYYY-MM-DD
    Got:
        123

    >>> date_val(True)
    Traceback (most recent call last):
        ...
    Error: Expected a valid date in the format YYYY-MM-DD
    Got:
        True


DateTimeVal
===========

DateTimeVal accepts ISO8601-formatted date/time strings, as well as ``date``
and ``datetime`` objects. All are coerced to a ``datetime`` object::

    >>> dt_val = DateTimeVal()
    >>> dt_val
    DateTimeVal()
    >>> dt_val(TEST_DATETIME)
    datetime.datetime(2015, 1, 1, 12, 34, 56, 789)
    >>> dt_val(TEST_DATE)
    datetime.datetime(2015, 1, 1, 0, 0)
    >>> dt_val('2015-01-01T12:34:56.000789')
    datetime.datetime(2015, 1, 1, 12, 34, 56, 789)
    >>> dt_val('2015-01-01T12:34:56')
    datetime.datetime(2015, 1, 1, 12, 34, 56)
    >>> dt_val('2015-01-01')
    datetime.datetime(2015, 1, 1, 0, 0)
    >>> dt_val('2015-01-01T12:34:56Z')
    datetime.datetime(2015, 1, 1, 12, 34, 56)
    >>> dt_val('2015-01-01T12:34:56+0230')
    datetime.datetime(2015, 1, 1, 10, 4, 56)
    >>> dt_val('2015-01-01T12:34:56.000789+0230')
    datetime.datetime(2015, 1, 1, 10, 4, 56, 789)

    >>> dt_val('2015-02-30T12:34:56')
    Traceback (most recent call last):
        ...
    Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS
    Got:
        '2015-02-30T12:34:56'

    >>> dt_val('2015-02-30')
    Traceback (most recent call last):
        ...
    Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS
    Got:
        '2015-02-30'

    >>> dt_val('2015-01-01T12:99:56')
    Traceback (most recent call last):
        ...
    Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS
    Got:
        '2015-01-01T12:99:56'

    >>> dt_val('foobar')
    Traceback (most recent call last):
        ...
    Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS
    Got:
        'foobar'

    >>> dt_val(123)
    Traceback (most recent call last):
        ...
    Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS
    Got:
        123

    >>> dt_val(True)
    Traceback (most recent call last):
        ...
    Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS
    Got:
        True


TimeVal
=======

TimeVal accepts ISO8601-formatted time strings, as well as ``time``
and ``datetime`` objects. All are coerced to a ``time`` object::

    >>> time_val = TimeVal()
    >>> time_val
    TimeVal()
    >>> time_val(TEST_TIME)
    datetime.time(12, 34, 56, 789)
    >>> time_val(TEST_DATETIME)
    datetime.time(12, 34, 56, 789)
    >>> time_val('12:34:56')
    datetime.time(12, 34, 56)
    >>> time_val('12:34:56.000789')
    datetime.time(12, 34, 56, 789)

    >>> time_val('12:99:56')
    Traceback (most recent call last):
        ...
    Error: Expected a valid time in the format HH:MM:SS[.FFFFFF]
    Got:
        '12:99:56'

    >>> time_val('foobar')
    Traceback (most recent call last):
        ...
    Error: Expected a valid time in the format HH:MM:SS[.FFFFFF]
    Got:
        'foobar'

    >>> time_val(123)
    Traceback (most recent call last):
        ...
    Error: Expected a valid time in the format HH:MM:SS[.FFFFFF]
    Got:
        123

    >>> time_val(True)
    Traceback (most recent call last):
        ...
    Error: Expected a valid time in the format HH:MM:SS[.FFFFFF]
    Got:
        True

