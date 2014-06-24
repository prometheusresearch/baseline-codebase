#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json
import codecs
import pkg_resources

from datetime import date, time, datetime
from decimal import Decimal

from rex.core import cached


__all__ = (
    'to_unicode',
    'to_str',
    'to_json',
    'RexJSONEncoder',
    'package_version',
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

    if isinstance(value, basestring):
        return codecs.decode(value, encoding)
    elif value is None:
        return None
    else:
        return unicode(value)


def to_str(value, encoding='utf-8'):
    """
    Encodes a unicode object to its string equivalent.

    :param value: the source string to encode
    :type value: str or unicode
    :param encoding:
        the encoding method to use; if not specified, 'utf-8' is used
    :type encoding: string
    :rtype: str
    """

    if isinstance(value, basestring):
        return codecs.encode(value, encoding)
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

    def default(self, obj):
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

