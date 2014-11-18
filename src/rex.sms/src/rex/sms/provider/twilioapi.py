#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import get_settings, Error, Setting, StrVal
from twilio.rest import TwilioRestClient

from .base import SmsProvider


__all__ = (
    'TwilioSmsProvider',
)


def setting_or_die(name):
    setting = getattr(get_settings(), name, None)
    if setting is None:
        raise Error(
            'Setting %s must be specified.' % (
                name,
            )
        )
    return setting


class TwilioSmsProvider(SmsProvider):
    """
    An implementation of SmsProvider that uses the Twilio API to send the SMS
    messages.
    """

    #: The name of this implementation used by the ``sms_provider`` setting.
    name = 'twilio'

    def __init__(self):
        super(TwilioSmsProvider, self).__init__()
        self.client = None
        self.from_number = None

    def initialize(self):
        super(TwilioSmsProvider, self).__init__()

        account = setting_or_die('sms_twilio_account_sid')
        token = setting_or_die('sms_twilio_token')
        timeout = setting_or_die('sms_twilio_timeout')

        self.client = TwilioRestClient(
            account=account,
            token=token,
            timeout=timeout,
        )

        self.from_number = setting_or_die('sms_twilio_from_number')

    def __call__(self, recipient, message):
        redirect = get_settings().sms_force_recipient  # pylint: disable=E1101
        if redirect:
            recipient = redirect

        message = self.client.messages.create(
            to=recipient,
            from_=self.from_number,
            body=message,
        )


class SmsTwilioAccountSidSetting(Setting):
    """
    The Account SID to use when connecting to the Twilio API.
    """

    name = 'sms_twilio_account_sid'
    validate = StrVal()
    default = None


class SmsTwilioTokenSetting(Setting):
    """
    The API Token to use when connecting to the Twilio API.
    """

    name = 'sms_twilio_token'
    validate = StrVal()
    default = None


class SmsTwilioTimeoutSetting(Setting):
    """
    The number of seconds to use as a timeout threshold when accessing the
    Twilio API.

    Defaults to: 5
    """

    name = 'sms_twilio_timeout'
    validate = StrVal()
    default = 5


class SmsTwilioFromNumber(Setting):
    """
    The TN/ShortCode to use as the "From" number when sending messages through
    the Twilio API.
    """

    name = 'sms_twilio_from_number'
    validate = StrVal()  # TODO: validate this; can be normal or short code
    default = None

