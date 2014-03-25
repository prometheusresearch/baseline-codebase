#
# Copyright (c) 2014, Prometheus Research, LLC
#


from datetime import datetime

from babel import numbers, dates
from pytz import timezone

from .core import get_locale, get_timezone


__all__ = (
    'format_number',
    'format_decimal',
    'format_currency',
    'format_percent',
    'format_scientific',
    'format_datetime',
    'format_date',
    'format_time',
    'format_timedelta',
)


# pylint: disable=W0622


def format_number(value):
    return numbers.format_number(
        value,
        locale=get_locale(),
    )


def format_decimal(value, format=None):
    return numbers.format_decimal(
        value,
        format=format,
        locale=get_locale(),
    )


def format_currency(value, currency, format=None):
    return numbers.format_currency(
        value,
        currency,
        format=format,
        locale=get_locale(),
    )


def format_percent(value, format=None):
    return numbers.format_percent(
        value,
        format=format,
        locale=get_locale(),
    )


def format_scientific(value, format=None):
    return numbers.format_scientific(
        value,
        format=format,
        locale=get_locale(),
    )


def format_datetime(value, format='medium', rebase=True):
    return dates.format_datetime(
        value,
        format=format,
        locale=get_locale(),
        tzinfo=get_timezone() if rebase else None,
    )


def format_date(value, format='medium', rebase=True):
    if rebase and isinstance(value, datetime):
        if not value.tzinfo:
            value = value.replace(tzinfo=timezone('UTC'))

        target_tz = get_timezone()
        value = target_tz.normalize(value.astimezone(target_tz))

    return dates.format_date(
        value,
        format=format,
        locale=get_locale(),
    )


def format_time(value, format='medium', rebase=True):
    return dates.format_time(
        value,
        format=format,
        locale=get_locale(),
        tzinfo=get_timezone() if rebase else None,
    )


def format_timedelta(value, granularity='second', add_direction=False):
    if isinstance(value, datetime):
        value = datetime.utcnow() - value

    return dates.format_timedelta(
        value,
        granularity=granularity,
        add_direction=add_direction,
        locale=get_locale(),
    )

