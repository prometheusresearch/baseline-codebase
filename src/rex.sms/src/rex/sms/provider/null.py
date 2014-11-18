#
# Copyright (c) 2014, Prometheus Research, LLC
#


from .base import SmsProvider


__all__ = (
    'NullSmsProvider',
)


class NullSmsProvider(SmsProvider):
    """
    An implementation of SmsProvider that does not send the messages anywhere,
    nor does it output anything.
    """

    #: The name of this implementation used by the ``sms_provider`` setting.
    name = 'null'

    def __call__(self, recipient, message):
        # No-Op
        pass

