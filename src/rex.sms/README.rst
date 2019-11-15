*************************
REX.SMS Programming Guide
*************************

.. contents:: Table of Contents


Overview
========

This package provides a uniform interface for sending SMS text messages.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Composing and Sending SMS Messages
===================================

``rex.sms`` provides a convenient set of functions for sending SMS messages.

By default, outgoing emails are printed to standard out, and the following
are examples of that functionality. To actually deliver the messages, see the
`Configuring Providers`_ section.

First, we need the appropriate environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.sms_demo')

Now we can send an SMS message using ``rex.sms.send_sms()``::

    >>> from rex.sms import send_sms

    >>> with rex:
    ...     send_sms('203-555-1234', '860-555-9999', 'Hello dear friend!')
    === SMS MESSAGE SENT ===
    TO: +12035551234
    FROM: +18605559999
    MESSAGE: Hello dear friend!

As you can see, the ``send_sms()`` function takes two arguments: the mobile
phone number to send the message to, and the message itself.

``rex.sms`` provides a convenience function for constructing SMS messages from
Jinja templates. Suppose we add the template ``/templates/context.txt`` to the
``rex.sms_demo`` package::

    Hello {{ name }}!

This template takes one parameter: ``name``. We could convert this template to
an SMS message using the function ``rex.sms.compose()``::

    >>> from rex.sms import compose

    >>> with rex:
    ...     msg = compose('rex.sms_demo:/templates/context.txt', name='Billy')
    ...     send_sms('203-555-1234', '860-555-9999', msg)
    === SMS MESSAGE SENT ===
    TO: +12035551234
    FROM: +18605559999
    MESSAGE: Hello Billy!


Configuring Providers
=====================

By default, ``rex.sms`` doesn't actually deliver SMS messages to a real mobile
phone network. Instead, it prints the message and its recipient to standard
out. To change this, you alter the value of the ``sms_provider`` setting. The
``rex.sms`` package allows you to set this to:

``null``
    The system does nothing when the ``send_sms()`` function is invoked.

``stdout``
    The system prints the recipient and message to standard out. No message is
    actually sent.

``logging``
    The system prints the recipient and message using the ``rex.logging``
    framework. No message is actually sent.

``twilio``
    The system sends the message to the recipient via the `Twilio`_ APIs.

    .. _`Twilio`: https://www.twilio.com/

    When using the ``twilio`` provider, you must also configure the
    following settings:

    ``sms_twilio_account_sid``
        The Account SID to use when connecting to the Twilio API.

    ``sms_twilio_token``
        The API Token to use when connecting to the Twilio API.

You can implement your own Provider by writing a class that inherits from the
``rex.sms.SmsProvider`` extension. See the API Reference for details.


Settings
========

Aside from ``sms_provider`` and the other settings discussed in the
`Configuring Providers`_ section, this package also has the following settings
available:

``sms_force_recipient``
    This setting can contain a telephone number that will be used to override
    any number that is passed in as a recipient to the ``send_sms()`` function.
    This is useful in development and testing situations to avoid sending
    messages accidentally to people who may not be expecting messages from your
    application.

