*********
Utilities
*********

.. contents:: Table of Contents


String Conversions
==================

The ``util`` module provides a couple of convenience functions for converting
strings from and to their unicode representations::

    >>> from rex.instrument.util import to_unicode

    >>> to_unicode('foobar')
    'foobar'
    >>> to_unicode(b'foobar')
    'foobar'
    >>> to_unicode(dict())
    '{}'
    >>> to_unicode(None)

    >>> sfoo = b'foo\xe2\x80\x94bar'
    >>> type(sfoo), repr(sfoo)
    (<class 'bytes'>, "b'foo\\xe2\\x80\\x94bar'")

    >>> ufoo = 'foo\u2014bar'
    >>> type(ufoo), repr(ufoo)
    (<class 'str'>, "'foo\u2014bar'")

    >>> sfoo
    b'foo\xe2\x80\x94bar'
    >>> to_unicode(sfoo)
    'foo\u2014bar'

    >>> ufoo
    'foo\u2014bar'
    >>> to_unicode(ufoo)
    'foo\u2014bar'


JSON Encoding
=============

The ``util`` module provides a custom JSON encoder that extends the standard
library's encoder with support for date, time, datetime, and Decimal objects::

    >>> from rex.instrument.util import to_json

    >>> from datetime import date, time, datetime
    >>> to_json(date(1980, 5, 22))
    '"1980-05-22"'
    >>> to_json({'my_date': date(1980, 5, 22)})
    '{"my_date": "1980-05-22"}'
    >>> to_json(time(12, 34, 56))
    '"12:34:56"'
    >>> to_json({'my_time': time(12, 34, 56)})
    '{"my_time": "12:34:56"}'
    >>> to_json(datetime(1980, 5, 22, 12, 34, 56))
    '"1980-05-22T12:34:56"'
    >>> to_json({'my_datetime': datetime(1980, 5, 22, 12, 34, 56)})
    '{"my_datetime": "1980-05-22T12:34:56"}'
    >>> to_json({'foo': 123, 'bar': complex(1, 2)})
    Traceback (most recent call last):
        ...
    TypeError: Object of type 'complex' is not JSON serializable

    >>> from decimal import Decimal
    >>> to_json(Decimal('1.23'))
    '"1.23"'
    >>> to_json({'my_decimal': Decimal('1.23')})
    '{"my_decimal": "1.23"}'


Interface Implementation Retrival
=================================

The ``util`` module provides a convenience function for retrieving interface
class implementations in the currently-executing application::

    >>> from rex.instrument.util import get_implementation
    >>> from rex.core import Rex
    >>> rex = Rex('rex.instrument_demo')
    >>> rex.on()

    >>> get_implementation('user', package_name='instrument')
    rex.instrument_demo.DemoUser

    >>> get_implementation('instrument')
    rex.instrument_demo.DemoInstrument

    >>> get_implementation('doesntexist')
    Traceback (most recent call last):
        ...
    NotImplementedError: "No implementation of "doesntexist" exists in "instrument"

    >>> get_implementation('instrument', package_name='doesntexist')
    Traceback (most recent call last):
        ...
    NotImplementedError: "No implementation of "instrument" exists in "doesntexist"

    >>> rex.off()


Dates/Times
===========

The ``util`` module provides some convenience functions for retrieving
``datetime`` and ``time`` objects that are non-naive::

    >>> from rex.instrument.util import get_current_datetime, get_current_time

    >>> test = get_current_datetime()
    >>> test.tzinfo
    <UTC>

    >>> test = get_current_time()
    >>> test.tzinfo
    <UTC>


