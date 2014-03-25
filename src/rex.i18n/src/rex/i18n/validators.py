#
# Copyright (c) 2014, Prometheus Research, LLC
#


from datetime import tzinfo

from babel import Locale
from pytz import timezone

from rex.core import Validate, Error


__all__ = (
    'LocaleVal',
    'TimezoneVal',
)


class LocaleVal(Validate):
    """
    Accepts POSIX locale identifiers and coerces them to ``babel.Locale``
    objects.
    """

    def __call__(self, data):
        try:
            return Locale.parse(data)
        except Exception as exc:
            raise Error(exc.message)


class TimezoneVal(Validate):
    """
    Accepts IANA Time Zone Database identifiers and coerces them to
    ``pytz.timezone`` objects.
    """

    def __call__(self, data):
        if isinstance(data, tzinfo):
            return data

        try:
            return timezone(data)
        except:
            raise Error('expected an IANA TZ identifier, got \'%s\'' % data)

