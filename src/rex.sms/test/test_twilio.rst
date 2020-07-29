**************
TwilioProvider
**************


The TwilioProvider integrates with the Twilio REST APIs to send SMS messages to
their recipients::

    >>> from rex.sms import send_sms, get_sms_provider
    >>> from rex.core import Rex
    >>> from mock import MagicMock

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid='abc123', sms_twilio_token='def456')
    >>> rex.on()

    >>> mockTwilio = MagicMock()
    >>> get_sms_provider().client = mockTwilio

    >>> send_sms('2035551234', '8002223333', 'hello world')
    >>> mockTwilio.messages.create.assert_called_once_with(body='hello world', to='+12035551234', from_='+18002223333')

    >>> rex.off()


    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid='abc123', sms_twilio_token='def456', sms_force_recipient='2035559999')
    >>> rex.on()

    >>> mockTwilio = MagicMock()
    >>> get_sms_provider().client = mockTwilio

    >>> send_sms('2035551234', '8002223333', 'hello world')
    >>> mockTwilio.messages.create.assert_called_once_with(body='hello world', to='+12035559999', from_='+18002223333')

    >>> mockTwilio = MagicMock()
    >>> get_sms_provider().client = mockTwilio
    >>> send_sms('2035551234', 'MGSOMEFAKESERVICEID', 'hello world')
    >>> mockTwilio.messages.create.assert_called_once_with(body='hello world', to='+12035559999', from_='MGSOMEFAKESERVICEID')

    >>> rex.off()


If the call to Twilio results in a 500-series error code, we'll retry a few
times before raising the exception::

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid='abc123', sms_twilio_token='def456')
    >>> rex.on()

    >>> from twilio.base.exceptions import TwilioRestException
    >>> def twilio_fail(*args, **kwargs):
    ...     raise TwilioRestException(500, 'http://fake')
    >>> mockTwilio = MagicMock()
    >>> mockTwilio.messages.create.side_effect = twilio_fail
    >>> get_sms_provider().client = mockTwilio

    >>> send_sms('2035551234', '8002223333', 'hello world')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    twilio.base.exceptions.TwilioRestException: ...

    >>> mockTwilio.messages.create.call_count
    3

We handle 429 Too Many Requests error the same way by retrying::

    >>> def twilio_fail(*args, **kwargs):
    ...     raise TwilioRestException(429, 'http://fake')
    >>> mockTwilio = MagicMock()
    >>> mockTwilio.messages.create.side_effect = twilio_fail
    >>> get_sms_provider().client = mockTwilio

    >>> send_sms('2035551234', '8002223333', 'hello world')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    twilio.base.exceptions.TwilioRestException: ...

    >>> mockTwilio.messages.create.call_count
    3

Other erorrs are raised without a retry::

    >>> def twilio_fail(*args, **kwargs):
    ...     raise TwilioRestException(401, 'http://fake')
    >>> mockTwilio = MagicMock()
    >>> mockTwilio.messages.create.side_effect = twilio_fail
    >>> get_sms_provider().client = mockTwilio

    >>> send_sms('2035551234', '8002223333', 'hello world')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    twilio.base.exceptions.TwilioRestException: ...

    >>> mockTwilio.messages.create.call_count
    1

    >>> def twilio_fail(*args, **kwargs):
    ...     raise TwilioRestException(401, 'http://fake', code=21610)
    >>> mockTwilio = MagicMock()
    >>> mockTwilio.messages.create.side_effect = twilio_fail
    >>> get_sms_provider().client = mockTwilio

    >>> send_sms('2035551234', '8002223333', 'hello world')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.sms.errors.BlockedSmsError: +12035551234

    >>> mockTwilio.messages.create.call_count
    1

    >>> rex.off()


When using TwilioProvider, the ``sms_twilio_account_sid`` and
``sms_twilio_token`` must be specified in the settings in order for it to
communicate with the Twilio API::

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_token='def456')
    Traceback (most recent call last):
        ...
    rex.core.Error: Setting sms_twilio_account_sid must be specified.
    While initializing RexDB application:
        rex.sms
    With parameters:
        sms_provider: 'twilio'
        sms_twilio_token: 'def456'

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid='abc123')
    Traceback (most recent call last):
        ...
    rex.core.Error: Setting sms_twilio_token must be specified.
    While initializing RexDB application:
        rex.sms
    With parameters:
        sms_provider: 'twilio'
        sms_twilio_account_sid: 'abc123'

