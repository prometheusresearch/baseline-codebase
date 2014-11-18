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

    >>> send_sms('2035551234', 'hello world')
    === SMS MESSAGE SENT ===
    SENT TO: +12035551234
    MESSAGE: hello world


The recipient must be a valid phone number::

    >>> send_sms('123', 'hello world')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got '123'


compose
=======

The ``compose`` function is a convenience wrapper around the use of Jinja to
generate text that can be sent as an SMS message::

    >>> compose('rex.sms_demo:/templates/simple.txt')
    u'Hello World!'

    >>> compose('rex.sms_demo:/templates/context.txt', name='Jay')
    u'Hello Jay!'


    >>> rex.off()

