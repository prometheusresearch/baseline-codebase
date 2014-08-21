#
# Copyright (c) 2014, Prometheus Research, LLC
#


from datetime import tzinfo

from babel import Locale, UnknownLocaleError
from pytz import timezone, UnknownTimeZoneError

from rex.core import StrVal, Error


__all__ = (
    'LocaleVal',
    'TimezoneVal',
)


class LocaleVal(StrVal):
    """
    Accepts POSIX locale identifiers and coerces them to ``babel.Locale``
    objects.
    """

    def __call__(self, data):
        try:
            return Locale.parse(data)
        except UnknownLocaleError:
            raise Error(
                'expected a POSIX locale identifier, got \'%s\'' % data
            )


class TimezoneVal(StrVal):
    """
    Accepts IANA Time Zone Database identifiers and coerces them to
    ``pytz.timezone`` objects.
    """

    def __call__(self, data):
        if isinstance(data, tzinfo):
            return data

        try:
            return timezone(data)
        except UnknownTimeZoneError:
            raise Error('expected an IANA TZ identifier, got \'%s\'' % data)

