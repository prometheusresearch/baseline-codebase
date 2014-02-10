#
# Copyright (c) 2013, Prometheus Research, LLC
#

import json
import re
import urllib
import urlparse

from datetime import datetime, date, time

from rex.core import cached, Extension


__all__ = (
    'Serializer',
    'JsonSerializer',
    'UrlSerializer',
)


class Serializer(Extension):
    format_string = None
    mime_type = None

    @classmethod
    @cached
    def map_by_format(cls):
        mapping = {}
        for ext in cls.all():
            assert ext.format_string not in mapping, \
                'duplicate format string: %s' % ext.format_string
            mapping[ext.format_string] = ext
        return mapping

    @classmethod
    @cached
    def map_by_mime_type(cls):
        mapping = {}
        for ext in cls.all():
            assert ext.mime_type not in mapping, \
                'duplicate mime type: %s' % ext.mime_type
            mapping[ext.mime_type] = ext
        return mapping

    @classmethod
    @cached
    def get_for_mime_type(cls, mime_type):
        mime_type = mime_type.split(';')[0]
        return cls.map_by_mime_type().get(mime_type)

    @classmethod
    @cached
    def get_for_format(cls, format):
        return cls.map_by_format().get(format)

    @classmethod
    def enabled(cls):
        return (cls.format_string is not None and cls.mime_type is not None)

    @classmethod
    def sanitize(cls):
        if cls.enabled():
            assert cls.serialize != Serializer.serialize, \
                'abstract method %s.serialize()' % cls
            assert cls.deserialize != Serializer.deserialize, \
                'abstract method %s.deserialize()' % cls

    def serialize(self, value):
        raise NotImplementedError()

    def deserialize(self, value):
        raise NotImplementedError()


def datetime_to_str(val):
    r = val.isoformat()
    if val.microsecond:
        r = r[:23] + r[26:]
    if r.endswith('+00:00'):
        r = r[:-6] + 'Z'
    return r


def date_to_str(val):
    return val.isoformat()


def time_to_str(val):
    r = val.isoformat()
    if val.microsecond:
        r = r[:12]
    return r


class RestfulJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return datetime_to_str(obj)

        elif isinstance(obj, date):
            return date_to_str(obj)

        elif isinstance(obj, time):
            return time_to_str(obj)

        else:
            return super(RestfulJSONEncoder, self).default(obj)


class JsonSerializer(Serializer):
    format_string = 'json'
    mime_type = 'application/json'

    def serialize(self, value):
        return json.dumps(value, cls=RestfulJSONEncoder)

    def deserialize(self, value):
        return json.loads(value)


RE_SUBKEY = re.compile(r'^(?P<mainkey>[^\[]+)\[(?P<subkey>.+)\]$')


class UrlSerializer(Serializer):
    format_string = 'url'
    mime_type = 'application/x-www-form-urlencoded'

    def _flatten_structure(self, data):
        flattened = []
        for key, value in data:
            if isinstance(value, dict):
                flat_value = self._flatten_structure(value.items())
                for fkey, fvalue in flat_value:
                    flattened.append((
                        '%s[%s]' % (key, fkey),
                        fvalue,
                    ))
            else:
                flattened.append((key, value))

        return flattened

    def _encode_dates(self, params):
        new_params = []

        for param in params:
            if isinstance(param[1], datetime):
                new_params.append((param[0], datetime_to_str(param[1])))

            elif isinstance(param[1], date):
                new_params.append((param[0], date_to_str(param[1])))

            elif isinstance(param[1], time):
                new_params.append((param[0], time_to_str(param[1])))

            else:
                new_params.append(param)

        return new_params

    def serialize(self, value):
        if isinstance(value, dict):
            kv = value.items()
        elif isinstance(value, (list, tuple)):
            kv = value
        else:
            raise TypeError(
                'Only lists, tuples, and dicts can be URL serialized'
            )

        params = self._flatten_structure(kv)
        params = self._encode_dates(params)

        return urllib.urlencode(params, doseq=True)

    def deserialize(self, value):
        # Parse the string.
        raw = urlparse.parse_qs(
            value,
            keep_blank_values=True,
            strict_parsing=False,
        )

        data = {}
        for key, value in raw.items():
            # De-listify keys that only have one value.
            if len(value) == 1:
                value = value[0]

            # Figure out it there's any key nesting.
            keychain = []
            parts = RE_SUBKEY.match(key)
            while parts:
                keychain.append(parts.groupdict()['mainkey'])
                parts = RE_SUBKEY.match(parts.groupdict()['subkey'])

            # If we're nested, build the chain of dicts.
            if keychain:
                key = keychain[0]
                v = c = {}
                for subkey in keychain[1:]:
                    c[subkey] = {}
                    c = c[subkey]
                c = value
                value = v

            data[key] = value

        return data

