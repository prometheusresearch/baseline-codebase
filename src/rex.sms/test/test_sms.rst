***
SMS
***

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.sms import *
    >>> from rex.core import Rex
    >>> rex = Rex('rex.sms_demo')
    >>> rex.on()


send_sms
========

The ``send_sms`` function does exactly as its name implies; it sends an SMS
message to the specified recipient::

    >>> send_sms('2035551234', '8605559999', 'hello world')
    === SMS MESSAGE SENT ===
    TO: +12035551234
    FROM: +18605559999
    MESSAGE: hello world

    >>> send_sms('2035551234', '23456', 'hello world')
    === SMS MESSAGE SENT ===
    TO: +12035551234
    FROM: 23456
    MESSAGE: hello world

The recipient must be a valid phone number::

    >>> send_sms('123', '8605559999', 'hello world')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got '123'

The sender must be a valid phone number or short code::

    >>> send_sms('2035551234', '123', 'hello world')
    Traceback (most recent call last):
        ...
    Error: Failed to match the value against any of the following:
        expected a phone number, got '123'
    <BLANKLINE>
        expected a short code, got '123'


compose
=======

The ``compose`` function is a convenience wrapper around the use of Jinja to
generate text that can be sent as an SMS message::

    >>> compose('rex.sms_demo:/templates/simple.txt')
    u'Hello World!'

    >>> compose('rex.sms_demo:/templates/context.txt', name='Jay')
    u'Hello Jay!'


    >>> rex.off()

