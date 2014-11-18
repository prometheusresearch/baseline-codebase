********
Settings
********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.core import Rex, get_settings


sms_provider
============

This setting tells the application which provider implementation to use when
sending messages::

    >>> app = Rex('rex.sms')
    >>> with app:
    ...     get_settings().sms_provider
    'stdout'

    >>> app = Rex('rex.sms', sms_provider='null')
    >>> with app:
    ...     get_settings().sms_provider
    'null'

    >>> app = Rex('rex.sms', sms_provider='foo')
    Traceback (most recent call last):
        ...
    Error: No SMS Provider known by "foo"
    While initializing RexDB application:
        rex.sms
    With parameters:
        sms_provider: 'foo'


sms_force_recipient
===================

This settings tells the application to always send SMS messages to the
specified number, regardless of what recipient is indicated in the function
calls::

    >>> app = Rex('rex.sms')
    >>> with app:
    ...     get_settings().sms_force_recipient is None
    True

    >>> app = Rex('rex.sms', sms_force_recipient='2035551234')
    >>> with app:
    ...     get_settings().sms_force_recipient
    u'+12035551234'

    >>> app = Rex('rex.sms', sms_force_recipient='foobar')
    Traceback (most recent call last):
        ...
    Error: expected a phone number, got 'foobar'
    While validating setting:
        sms_force_recipient
    While initializing RexDB application:
        rex.sms
    With parameters:
        sms_force_recipient: 'foobar'

