#
# Copyright (c) 2015, Prometheus Research, LLC
#

import re

from datetime import date, datetime, time

from dateutil.parser import parse as parse_date
from dateutil.tz import tzutc

from rex.core import Validate, guard, Error


__all__ = (
    'DateVal',
    'DateTimeVal',
    'TimeVal',
)


class DateVal(Validate):
    """
    Accepts ISO8601-formatted date strings and coerces them to
    ``datetime.date`` objects.
    """

    ERROR_MSG = 'Expected a valid date in the format YYYY-MM-DD'

    def __call__(self, data):
        if isinstance(data, datetime):
            return data.date()
        if isinstance(data, date):
            return data

        with guard('Got:', repr(data)):
            if isinstance(data, (str, unicode)):
                try:
                    return datetime.strptime(data, '%Y-%m-%d').date()
                except ValueError:
                    raise Error(DateVal.ERROR_MSG)
            else:
                raise Error(DateVal.ERROR_MSG)


class DateTimeVal(Validate):
    """
    Accepts ISO8601-formatted date/time strings and coerces them to
    ``datetime.datetime`` objects. The resulting object will always be coerced
    to UTC and returned as naive.
    """

    ERROR_MSG = 'Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS'

    RE_DATETIME = re.compile(
        r'^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])'
        r'(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?'
        r'(Z|[+-](?:2[0-3]|[01][0-9]):?[0-5][0-9])?)?$'
    )

    def __call__(self, data):
        if isinstance(data, datetime):
            return data
        if isinstance(data, date):
            return datetime(
                data.year,
                data.month,
                data.day,
            )

        with guard('Got:', repr(data)):
            if isinstance(data, (str, unicode)) and \
                    DateTimeVal.RE_DATETIME.match(data):
                try:
                    parsed = parse_date(data)
                    if parsed.tzinfo:
                        parsed = parsed.astimezone(tzutc()).replace(
                            tzinfo=None,
                        )
                    return parsed
                except ValueError:
                    raise Error(DateTimeVal.ERROR_MSG)
            else:
                raise Error(DateTimeVal.ERROR_MSG)


class TimeVal(Validate):
    """
    Accepts ISO8601-formatted time strings and coerces them to
    ``datetime.time`` objects.
    """

    ERROR_MSG = 'Expected a valid time in the format HH:MM:SS[.FFFFFF]'

    RE_TIME = re.compile(
        r'^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?$',
    )

    def __call__(self, data):
        if isinstance(data, datetime):
            return data.time()
        if isinstance(data, time):
            return data

        with guard('Got:', repr(data)):
            if isinstance(data, (str, unicode)) and \
                    TimeVal.RE_TIME.match(data):
                try:
                    return parse_date(data).time()
                except ValueError:
                    raise Error(TimeVal.ERROR_MSG)
            else:
                raise Error(TimeVal.ERROR_MSG)

