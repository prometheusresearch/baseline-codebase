#
# Copyright (c) 2013, Prometheus Research, LLC
#

import json
import re

from datetime import datetime, date, time
from decimal import Decimal

import yaml

from dateutil.parser import parse as parse_date

from rex.core import cached, Extension


__all__ = (
    'Serializer',
    'JsonSerializer',
    'YamlSerializer',
)


class Serializer(Extension):
    """
    This is an Extension that allows developers to implement additional data
    formatting/encoding methods for their APIs to support.
    """

    #: The string that identifies the Serializer when passed to the "format"
    #: querystring parameter. Must be specified by concrete classes.
    format_string = None

    #: The MIME type that identifies the format/encoding the Serializer. It is
    #: used when checking the incoming Content-Type for compatibility, and it
    #: is sent in the Content-Type of the response. Must be specified by
    #: concrete classes.
    mime_type = None

    @classmethod
    def signature(cls):
        return cls.mime_type

    @classmethod
    @cached
    def mapped_format(cls):
        """
        Returns mapping of format identifiers to the Serializer implementation
        that supports them.

        :rtype: dict
        """

        mapping = {}
        for ext in cls.all():
            assert ext.format_string not in mapping, \
                'duplicate format string: %s' % ext.format_string
            mapping[ext.format_string] = ext
        return mapping

    @classmethod
    @cached
    def get_for_mime_type(cls, mime_type):
        """
        Retrieves the Serializer implementation that supports the specified
        MIME type. If an implementation cannot be found, ``None`` is returned.

        :param mime_type: the MIME type to retrieve
        :type mime_type: string
        :rtype: Serializer
        """

        mime_type = mime_type.split(';')[0]
        return cls.mapped().get(mime_type)

    @classmethod
    @cached
    def get_for_format(cls, fmt):
        """
        Retrieves the Serializer implementation that supports the specified
        format identifier. If an implementation cannot be found, ``None`` is
        returned.

        :param fmt: the format identifier to retreive
        :type fmt: string
        :rtype: Serializer
        """

        return cls.mapped_format().get(fmt)

    @classmethod
    def enabled(cls):
        return cls.format_string is not None and cls.mime_type is not None

    @classmethod
    def sanitize(cls):
        if cls.enabled():
            assert cls.serialize != Serializer.serialize, \
                'abstract method %s.serialize()' % cls
            assert cls.deserialize != Serializer.deserialize, \
                'abstract method %s.deserialize()' % cls

    def serialize(self, value):
        """
        Encodes/Formats the data from the result of the API for transmission
        to the client.

        Must be implemented by concrete classes.

        :param value:
            the outgoing data that is to be serialized; typically, this is a
            Python ``dict``, ``list``, or ``tuple``
        :rtype: string
        """

        raise NotImplementedError()

    def deserialize(self, value):
        """
        Decodes the data from the client for use in the API methods.

        Must be implemented by concrete classes.

        :param value: the incoming data that is to be deserialized
        :type value:
            an object that acts as both a string and a file-like object
        :returns: the decoded object
        """

        raise NotImplementedError()


class RestfulJSONEncoder(json.JSONEncoder):
    # pylint: disable=E0202
    def default(self, obj):
        if isinstance(obj, datetime):
            parts = obj.utctimetuple()
            return '%d-%02d-%02dT%02d:%02d:%02d.%sZ' % (
                parts.tm_year,
                parts.tm_mon,
                parts.tm_mday,
                parts.tm_hour,
                parts.tm_min,
                parts.tm_sec,
                ('%06d' % obj.microsecond)[:-3],
            )

        elif isinstance(obj, (date, time)):
            return obj.isoformat()

        elif isinstance(obj, Decimal):
            return float(obj)

        else:
            return super(RestfulJSONEncoder, self).default(obj)


RE_DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
RE_TIME = re.compile(r'^\d{2}:\d{2}:\d{2}$')
RE_DATETIME = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z)?$')


def get_date_or_string(value):
    # pylint: disable=W0704

    if RE_DATETIME.match(value):
        try:
            return parse_date(value, ignoretz=True)
        except ValueError:  # pragma: no cover
            pass

    elif RE_DATE.match(value):
        try:
            return parse_date(value).date()
        except ValueError:  # pragma: no cover
            pass

    elif RE_TIME.match(value):
        try:
            return parse_date(value).time()
        except ValueError:  # pragma: no cover
            pass

    return value


# Adapted from http://stackoverflow.com/a/3235787
def restful_json_decoder(value):
    if isinstance(value, list):
        pairs = enumerate(value)
    elif isinstance(value, dict):
        pairs = value.items()

    results = []
    for key, val in pairs:
        if isinstance(val, basestring):
            val = get_date_or_string(val)

        elif isinstance(val, (dict, list)):
            val = restful_json_decoder(val)

        results.append((key, val))

    if isinstance(value, list):
        return [result[1] for result in results]

    elif isinstance(value, dict):
        return dict(results)


class JsonSerializer(Serializer):
    """
    An implementation of Serializer that supports JSON-encoded structures.
    """

    #:
    format_string = 'json'

    #:
    mime_type = 'application/json'

    def serialize(self, value):
        return json.dumps(value, cls=RestfulJSONEncoder)

    def deserialize(self, value):
        return json.loads(value, object_hook=restful_json_decoder)


class YamlSerializer(Serializer):
    """
    An implementation of Serializer that supports YAML-encoded structures.
    """

    #:
    format_string = 'yaml'

    #:
    mime_type = 'application/x-yaml'

    def serialize(self, value):
        return yaml.dump(value, Dumper=RestfulYamlDumper)

    def deserialize(self, value):
        return yaml.safe_load(value)


# pylint: disable=R0901,R0904
class RestfulYamlDumper(yaml.SafeDumper):
    def decimal_representer(self, data):
        return self.represent_scalar('tag:yaml.org,2002:float', str(data))

    def time_representer(self, data):
        return self.represent_scalar('tag:yaml.org,2002:str', data.isoformat())

RestfulYamlDumper.add_representer(
    Decimal,
    RestfulYamlDumper.decimal_representer,
)
RestfulYamlDumper.add_representer(
    time,
    RestfulYamlDumper.time_representer,
)

