#
# Copyright (c) 2014, Prometheus Research, LLC
#

from rex.core import Setting, StrVal

from .validators import TelephoneNumberVal


__all__ = (
    'SmsProviderSetting',
    'SmsForceRecipientSetting',
)


class SmsProviderSetting(Setting):
    """
    The Provider implementation to use when sending SMS messages.

    Defaults to: ``stdout``
    """

    name = 'sms_provider'
    validate = StrVal()
    default = 'stdout'


class SmsForceRecipientSetting(Setting):
    """
    The phone number that all SMS messages should be sent to regardless of the
    specified recipient. This setting is typically only useful in development
    or testing situations where you don't want to accidently send SMS messages
    to real or unknown people.

    Defaults to: ``None``
    """

    name = 'sms_force_recipient'
    validate = TelephoneNumberVal()
    default = None

