*********
Utilities
*********

.. contents:: Table of Contents


String Conversions
==================

The ``util`` module provides a couple of convenience functions for converting
strings from and to their unicode representations::

    >>> from rex.instrument.util import to_str, to_unicode

    >>> to_unicode('foobar')
    u'foobar'
    >>> to_unicode(u'foobar')
    u'foobar'
    >>> to_unicode(dict())
    u'{}'
    >>> to_unicode(None)

    >>> to_str('foobar')
    'foobar'
    >>> to_str(u'foobar')
    'foobar'
    >>> to_str(dict())
    '{}'
    >>> to_str(None)

    >>> to_unicode('f\xcf\x8c\xd1\xbbb\xc7\x9fr')
    u'f\u03cc\u047bb\u01dfr'
    >>> to_str(u'f\u03cc\u047bb\u01dfr')
    'f\xcf\x8c\xd1\xbbb\xc7\x9fr'


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
    TypeError: (1+2j) is not JSON serializable

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
    rex.instrument_demo.MyUser

    >>> get_implementation('instrument')
    rex.instrument_demo.MyInstrument

    >>> get_implementation('doesntexist') is None
    True

    >>> get_implementation('instrument', package_name='doesntexist') is None
    True


    >>> rex.off()

