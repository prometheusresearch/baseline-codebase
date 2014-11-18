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

    >>> validator('203555123456')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got '203555123456'
    >>> validator('foobar')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got 'foobar'

