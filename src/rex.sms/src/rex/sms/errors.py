#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.core import Error


__all__ = (
    'SmsError',
    'BlockedSmsError',
)


class SmsError(Error):
    pass


class BlockedSmsError(SmsError):
    pass

