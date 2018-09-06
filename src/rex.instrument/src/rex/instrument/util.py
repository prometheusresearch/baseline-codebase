#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json
import codecs
import pkg_resources
import pytz

from contextlib import contextmanager
from datetime import date, time, datetime
from decimal import Decimal
from functools import wraps

from rex.core import cached, get_settings


__all__ = (
    'to_unicode',
    'to_json',
    'RexJSONEncoder',
    'package_version',
    'memoized_property',
    'forget_memoized_property',
    'get_implementation',
    'get_current_datetime',
    'get_current_time',
    'global_scope',
)


def to_unicode(value, encoding='utf-8'):
    """
    Decodes a string to its unicode equivalent.

    :param value: the source string to decode
    :type value: str or unicode
    :param encoding:
        the encoding method of the source string; if not specified, 'utf-8' is
        used
    :type encoding: string
    :rtype: unicode
    """

    if isinstance(value, bytes):
        return value.decode(encoding)
    elif value is None:
        return None
    else:
        return str(value)


@cached
def package_version(package_name):
    """
    Retrieves the version of the specified package.

    :param package_name: the name of the package to retrieve the version for
    :type package_name: string
    :returns:
        the version string of the specified package, or None if the package
        could not be found
    """

    try:
        version = pkg_resources.get_distribution(package_name).version
    except pkg_resources.DistributionNotFound:
        version = None
    return version


class RexJSONEncoder(json.JSONEncoder):
    """
    An extension of the standard JSONEncoder that supports the encoding of the
    following types:

    * datetime.date
    * datetime.time
    * datetime.datetime
    * decimal.Decimal
    """

    def default(self, obj):  # pylint: disable=method-hidden
        if isinstance(obj, (date, time, datetime)):
            return obj.isoformat()

        if isinstance(obj, Decimal):
            return str(obj)

        return super(RexJSONEncoder, self).default(obj)


def to_json(obj, **kwargs):
    """
    Encodes the specified object as JSON using a customized JSON encoder that
    extends the standard library's encoder with support for:

    dates, times, and datetimes
        These objects are encoded as strings in ISO 8601 format.

    Decmial
        These objects are encoded as strings.

    :param obj: the object to encode
    :param kwargs: options to pass to Python's ``dumps`` function
    :returns: a string containing the JSON-encoded object
    """

    kwargs.pop('cls', None)
    if 'ensure_ascii' not in kwargs:
        kwargs['ensure_ascii'] = False

    return json.dumps(
        obj,
        cls=RexJSONEncoder,
        **kwargs
    )


def memoized_property(func):
    """
    A decorator that performs the same function as Python's ``property``
    decorator, but adds memoization functionality.
    """

    name = '%s__MEMOIZED' % func.__name__

    @wraps(func)
    def wrapper(self):
        if not hasattr(self, name):
            setattr(self, name, func(self))
        return getattr(self, name)
    return property(wrapper)


def forget_memoized_property(instance, name):
    """
    Causes a memoized_property to forget the value it has cached, so that the
    next time the property is accessed, the function is re-executed.

    Typically, you'd reserve using @memoized_property for those properties that
    aren't going to change during the lifetime of the instance. But, there are
    always exceptions to everything, so this method gives you a way to force
    the instance to re-cache.

    :param instance: the object that contains the memoized property
    :type instance: object
    :param name: the name of the memoized property
    :type name: string
    """

    name = '%s__MEMOIZED' % name
    if hasattr(instance, name):
        delattr(instance, name)


@cached
def get_implementation(class_name, package_name='instrument'):
    """
    A convenience function for retrieving interface class implementations from
    the instance settings.

    :param class_name:
        the name of the interface class to retrieve the implementation for
    :type class_name: string
    :param package_name:
        the short package name of the package that defines the desired
        desired interface class; if not specified, defaults to "instrument"
    :type package_name: string
    :returns:
        the interface class implementation; None if the desired implementation
        could not be found
    """

    setting = getattr(
        get_settings(),
        '%s_implementation' % package_name.lower(),
        None,
    )

    if setting:
        impl = getattr(setting, class_name.lower(), None)
        if impl:
            return impl

    raise NotImplementedError(
        '"No implementation of "%s" exists in "%s"' % (
            class_name,
            package_name,
        )
    )


def get_current_datetime():
    """
    A convenience function for retrieving the current date/time as a non-naive
    datetime object. The object is set to the UTC timezone.

    :rtype: datetime
    """

    now = datetime.utcnow()
    return pytz.utc.localize(now)


def get_current_time():
    """
    A convenience function for retrieving the current time as a non-naive time
    object. The object is set to the UTC timezone.

    :rtype: time
    """

    now = datetime.utcnow().time()
    return now.replace(tzinfo=pytz.utc)


@contextmanager
def global_scope(scope_additions=None):
    """
    A context manager that will temporarily inject variables into the global
    Python scope.

    :param scope_additions:
        the variables to inject into the global Python scope
    :type scope_additions: dict
    """

    scope_additions = scope_additions or {}

    used_additional_scope = []
    for name, value in list(scope_additions.items()):
        if name not in __builtins__:
            __builtins__[name] = value
            used_additional_scope.append(name)
    try:
        yield
    finally:
        for name in used_additional_scope:
            if name in __builtins__:
                del __builtins__[name]

