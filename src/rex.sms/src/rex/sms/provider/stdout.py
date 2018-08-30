#
# Copyright (c) 2014, Prometheus Research, LLC
#


import sys

from .base import SmsProvider


__all__ = (
    'StdoutSmsProvider',
)


class StdoutSmsProvider(SmsProvider):
    """
    An implementation of SmsProvider that outputs all SMS messages to STDOUT.
    No message is actually sent anywhere.
    """

    #: The name of this implementation used by the ``sms_provider`` setting.
    name = 'stdout'

    def __call__(self, recipient, sender, message):
        sys.stdout.write('=== SMS MESSAGE SENT ===\n')
        sys.stdout.write('TO: %s\n' % recipient)
        sys.stdout.write('FROM: %s\n' % sender)
        sys.stdout.write('MESSAGE: %s\n' % (message,))

