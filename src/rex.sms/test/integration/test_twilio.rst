*********************************
TwilioProvider - Integration Test
*********************************

Set up the environment::

    >>> from rex.sms import send_sms
    >>> from rex.core import Rex
    >>> import os

    >>> TWILIO_ACCOUNT_SID = os.environ['TWILIO_ACCOUNT_SID']
    >>> TWILIO_TOKEN = os.environ['TWILIO_TOKEN']

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid=TWILIO_ACCOUNT_SID, sms_twilio_token=TWILIO_TOKEN)
    >>> rex.on()


Send a message successfully::

    >>> send_sms('5005550006', '5005550006', 'hello there!')


Get expected Twilio errors::

    >>> send_sms('5005550001', '5005550006', 'invalid phone number?')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    TwilioRestException: ...

    >>> send_sms('5005550002', '5005550006', 'cannot route?')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    TwilioRestException: ...

    >>> send_sms('5005550003', '5005550006', 'bad international permissions?')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    TwilioRestException: ...

    >>> send_sms('5005550004', '5005550006', 'number is blacklisted?')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    TwilioRestException: ...

    >>> send_sms('5005550009', '5005550006', 'number cannot receive sms?')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    TwilioRestException: ...



    >>> rex.off()

