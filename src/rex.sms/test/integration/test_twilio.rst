*********************************
TwilioProvider - Integration Test
*********************************

Set up the environment::

    >>> import os, logging
    >>> logging.disable(level=logging.WARNING)
    >>> from rex.sms import send_sms, BlockedSmsError
    >>> from rex.core import Rex

    >>> TWILIO_ACCOUNT_SID = os.environ['TWILIO_ACCOUNT_SID']
    >>> TWILIO_TOKEN = os.environ['TWILIO_TOKEN']

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid=TWILIO_ACCOUNT_SID, sms_twilio_token=TWILIO_TOKEN)
    >>> rex.on()


Send a message successfully::

    >>> send_sms('5005550006', '5005550006', 'hello there!')


Get expected Twilio errors::

    >>> try:
    ...     send_sms('5005550001', '5005550006', 'invalid phone number?')
    ... except Exception as exc:
    ...     assert exc.code == 21211

    >>> try:
    ...     send_sms('5005550002', '5005550006', 'cannot route?')
    ... except Exception as exc:
    ...     assert exc.code == 21612

    >>> try:
    ...     send_sms('5005550003', '5005550006', 'bad international permissions?')
    ... except Exception as exc:
    ...     assert exc.code == 21408

    >>> try:
    ...     send_sms('5005550004', '5005550006', 'number is blacklisted?')
    ... except BlockedSmsError:
    ...     pass

    >>> try:
    ...     send_sms('5005550009', '5005550006', 'number cannot receive sms?')
    ... except Exception as exc:
    ...     assert exc.code == 21614


    >>> rex.off()

