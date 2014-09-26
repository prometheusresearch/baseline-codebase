#
# Copyright (c) 2014, Prometheus Research, LLC
#


from datetime import datetime

from babel import numbers, dates
from pytz import utc

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
    """
    Returns the specified number formatted according to the currently-active
    locale.

    :param value: the number to format
    :rtype: string
    """

    return numbers.format_number(
        value,
        locale=get_locale(),
    )


def format_decimal(value, format=None):
    """
    Returns the specified decimal number formatted according to the currently-
    active locale.

    :param value: the number to format
    :param format:
        the format to use; if not specified, the locale default is used
    :rtype: string
    """

    return numbers.format_decimal(
        value,
        format=format,
        locale=get_locale(),
    )


def format_currency(value, currency, format=None):
    """
    Returns the specified number formatted as a currency value according to the
    currently-active locale.

    :param value: the number to format
    :param currency: the type of currency (e.g., ``USD``, ``EUR``)
    :param format:
        the format to use; if not specified, the locale default is used
    :rtype: string
    """

    return numbers.format_currency(
        value,
        currency,
        format=format,
        locale=get_locale(),
    )


def format_percent(value, format=None):
    """
    Returns the specified number formatted as a percentage value according to
    the currently-active locale.

    :param value: the number to format
    :param format:
        the format to use; if not specified, the locale default is used
    :rtype: string
    """

    return numbers.format_percent(
        value,
        format=format,
        locale=get_locale(),
    )


def format_scientific(value, format=None):
    """
    Returns the specified number formatted in scientific notation according to
    the currently-active locale.

    :param value: the number to format
    :param format:
        the format to use; if not specified, the locale default is used
    :rtype: string
    """

    return numbers.format_scientific(
        value,
        format=format,
        locale=get_locale(),
    )


def format_datetime(value, format='medium', rebase=True):
    """
    Returns the specified datetime formatted as a string according to the
    currently-active locale.

    :param value: the datetime to format
    :param format:
        the format to use; can be one of ``full``, ``long``, ``medium``,
        ``short``, or a custom format string; if not specified, ``medium`` is
        used
    :param rebase:
        adjust the datetime to represent the currently-active timezone; if not
        specified, the default is ``True``
    :rtype: string
    """

    return dates.format_datetime(
        value,
        format=format,
        locale=get_locale(),
        tzinfo=get_timezone() if rebase else None,
    )


def format_date(value, format='medium', rebase=True):
    """
    Returns the specified date formatted as a string according to the
    currently-active locale.

    :param value: the date to format
    :param format:
        the format to use; can be one of ``full``, ``long``, ``medium``,
        ``short``, or a custom format string; if not specified, ``medium`` is
        used
    :param rebase:
        adjust the date to represent the currently-active timezone; if not
        specified, the default is ``True``
    :rtype: string
    """

    if rebase and isinstance(value, datetime):
        if not value.tzinfo:
            value = value.replace(tzinfo=utc)

        target_tz = get_timezone()
        value = target_tz.normalize(value.astimezone(target_tz))

    return dates.format_date(
        value,
        format=format,
        locale=get_locale(),
    )


def format_time(value, format='medium', rebase=True):
    """
    Returns the specified time formatted as a string according to the
    currently-active locale.

    :param value: the time to format
    :param format:
        the format to use; can be one of ``full``, ``long``, ``medium``,
        ``short``, or a custom format string; if not specified, ``medium`` is
        used
    :param rebase:
        adjust the time to represent the currently-active timezone; if not
        specified, the default is ``True``
    :rtype: string
    """

    return dates.format_time(
        value,
        format=format,
        locale=get_locale(),
        tzinfo=get_timezone() if rebase else None,
    )


def format_timedelta(value, granularity='second', add_direction=False):
    """
    Returns the specified timedelta formatted as a string according to the
    currently-active lcoale.

    :param value:
        the timedelta or datetime to format; if a datetime, the delta will be
        calculated as the difference between ``value`` and
        ``datetime.utcnow()``
    :param granularity:
        determines the smallest unit that should be displayed; can be one of
        ``year``, ``month``, ``week``, ``day``, ``hour``, ``minute`` or
        ``second``; if not specified, defaults to ``second``
    :param add_direction:
        if ``True``, the returned string will contain text referring to the
        value being in the future or past; if not specified, defaults to
        ``False``
    :rtype: string
    """

    if isinstance(value, datetime):
        value = datetime.utcnow() - value

    return dates.format_timedelta(
        value,
        granularity=granularity,
        add_direction=add_direction,
        locale=get_locale(),
    )

