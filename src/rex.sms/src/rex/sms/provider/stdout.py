#
# Copyright (c) 2014, Prometheus Research, LLC
#


import sys

from rex.core import get_settings

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

    def __call__(self, recipient, message):
        redirect = get_settings().sms_force_recipient  # pylint: disable=E1101

        sys.stdout.write(u'=== SMS MESSAGE SENT ===\n')
        sys.stdout.write(u'SENT TO: ')
        if redirect:
            sys.stdout.write(u'%s (%s)\n' % (
                redirect,
                recipient,
            ))
        else:
            sys.stdout.write(u'%s\n' % recipient)
        sys.stdout.write(u'MESSAGE: %s\n' % (message,))

