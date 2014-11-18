**************
TwilioProvider
**************


The TwilioProvider integrates with the Twilio REST APIs to send SMS messages to
their recipients::

    >>> from rex.sms import send_sms, get_sms_provider
    >>> from rex.core import Rex

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid='abc123', sms_twilio_token='def456', sms_twilio_from_number='8002223333')
    >>> rex.on()

    >>> from mock import MagicMock
    >>> mockTwilio = MagicMock()
    >>> get_sms_provider().client = mockTwilio

    >>> send_sms('2035551234', 'hello world')
    >>> mockTwilio.messages.create.assert_called_once_with(body='hello world', to='+12035551234', from_='8002223333')

    >>> rex.off()


    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid='abc123', sms_twilio_token='def456', sms_twilio_from_number='8002223333', sms_force_recipient='2035559999')
    >>> rex.on()

    >>> from mock import MagicMock
    >>> mockTwilio = MagicMock()
    >>> get_sms_provider().client = mockTwilio

    >>> send_sms('2035551234', 'hello world')
    >>> mockTwilio.messages.create.assert_called_once_with(body='hello world', to='+12035559999', from_='8002223333')

    >>> rex.off()


When using TwilioProvider, the ``sms_twilio_account_sid``,
``sms_twilio_token``, and ``sms_twilio_from_number`` must be specified in the
settings in order for it to communicate with the Twilio API::

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_token='def456', sms_twilio_from_number='8002223333')
    Traceback (most recent call last):
        ...
    Error: Setting sms_twilio_account_sid must be specified.
    While initializing RexDB application:
        rex.sms
    With parameters:
        sms_provider: 'twilio'
        sms_twilio_from_number: '8002223333'
        sms_twilio_token: 'def456'

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid='abc123', sms_twilio_from_number='8002223333')
    Traceback (most recent call last):
        ...
    Error: Setting sms_twilio_token must be specified.
    While initializing RexDB application:
        rex.sms
    With parameters:
        sms_provider: 'twilio'
        sms_twilio_account_sid: 'abc123'
        sms_twilio_from_number: '8002223333'

    >>> rex = Rex('rex.sms', sms_provider='twilio', sms_twilio_account_sid='abc123', sms_twilio_token='def456')
    Traceback (most recent call last):
        ...
    Error: Setting sms_twilio_from_number must be specified.
    While initializing RexDB application:
        rex.sms
    With parameters:
        sms_provider: 'twilio'
        sms_twilio_account_sid: 'abc123'
        sms_twilio_token: 'def456'

