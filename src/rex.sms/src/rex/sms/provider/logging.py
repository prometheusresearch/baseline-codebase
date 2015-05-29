#
# Copyright (c) 2015, Prometheus Research, LLC
#


import sys

from rex.core import get_settings
from rex.logging import get_logger

from .base import SmsProvider


__all__ = (
    'LoggingSmsProvider',
)


class LoggingSmsProvider(SmsProvider):
    """
    An implementation of SmsProvider that outputs all SMS messages through
    the logging framework. No message is actually sent anywhere.
    """

    #: The name of this implementation used by the ``sms_provider`` setting.
    name = 'logging'

    def __call__(self, recipient, message):
        redirect = get_settings().sms_force_recipient  # pylint: disable=E1101

        if redirect:
            destination = '%s (%s)' % (
                redirect,
                recipient,
            )
        else:
            destination = recipient

        get_logger(self).info(
            'SMS Message sent to %s: %s',
            destination,
            message,
        )

