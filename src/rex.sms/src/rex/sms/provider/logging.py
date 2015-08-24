#
# Copyright (c) 2015, Prometheus Research, LLC
#


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

    def __call__(self, recipient, message, original_recipient=None):
        if original_recipient:
            destination = '%s (%s)' % (
                recipient,
                original_recipient,
            )
        else:
            destination = recipient

        get_logger(self).info(
            'SMS Message sent to %s: %s',
            destination,
            message,
        )

