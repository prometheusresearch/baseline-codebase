#
# Copyright (c) 2013, Prometheus Research, LLC
#

import json

from datetime import datetime, date, time
from decimal import Decimal

import yaml

from rex.core import cached, Extension


__all__ = (
    'Serializer',
    'JsonSerializer',
    'YamlSerializer',
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
    def get_for_format(cls, fmt):
        return cls.map_by_format().get(fmt)

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
        raise NotImplementedError()

    def deserialize(self, value):
        raise NotImplementedError()


class RestfulJSONEncoder(json.JSONEncoder):
    # pylint: disable=E0202
    def default(self, obj):
        if isinstance(obj, (datetime, date, time)):
            return obj.isoformat()

        elif isinstance(obj, Decimal):
            return float(obj)

        else:
            return super(RestfulJSONEncoder, self).default(obj)


class JsonSerializer(Serializer):
    format_string = 'json'
    mime_type = 'application/json'

    def serialize(self, value):
        return json.dumps(value, cls=RestfulJSONEncoder)

    def deserialize(self, value):
        return json.loads(value)


class YamlSerializer(Serializer):
    format_string = 'yaml'
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

