**********
Validators
**********

.. contents:: Table of Contents


TelephoneNumberVal
==================

The TelephoneNumberVal validator will accept a string input that looks like a
phone number and return it formatted in the international E.164 format::

    >>> from rex.sms import TelephoneNumberVal
    >>> validator = TelephoneNumberVal()

    >>> validator('203-555-1234')
    u'+12035551234'
    >>> validator('+1 (203) 555-1234')
    u'+12035551234'
    >>> validator('(203) 555 1234')
    u'+12035551234'

    >>> validator('203555123456')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got '203555123456'

    >>> validator('foobar')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got 'foobar'

    >>> validator('somethingthatsclearlynotaphonenumber2003990000blah')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got 'somethingthatsclearlynotaphonenumber2003990000blah'

    >>> validator('some@emailwithnumbers2001.com')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got 'some@emailwithnumbers2001.com'

    >>> validator = TelephoneNumberVal(default_region='GB')

    >>> validator('+44 20 7946 0234')
    u'+442079460234'

    >>> validator('1 (203) 555-1234')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got '1 (203) 555-1234'

    >>> validator('+0 (203) 555-1234')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got '+0 (203) 555-1234'

    >>> validator = TelephoneNumberVal(default_region='xx')
    Traceback (most recent call last):
        ...
    Error: Region "XX" is not supported


ShortCodeVal
============

::

    >>> from rex.sms import ShortCodeVal
    >>> validator = ShortCodeVal()

    >>> validator('23456')
    u'23456'
    >>> validator('23-45-6')
    u'23456'

    >>> validator('foobar')
    Traceback (most recent call last):
        ...
    Error: expected a short code, got 'foobar'

    >>> validator = ShortCodeVal(default_region='GB')

    >>> validator = ShortCodeVal(default_region='xx')
    Traceback (most recent call last):
        ...
    Error: Region "XX" is not supported

