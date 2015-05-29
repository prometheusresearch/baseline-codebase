#
# Copyright (c) 2015, Prometheus Research, LLC
#


import json
import re

from urlparse import parse_qs

from rex.core import Extension, MaybeVal, MapVal


__all__ = (
    'AsyncTransport',
)


RE_QUEUE_NAME = re.compile(r'^[a-z](?:[a-z0-9]|[_](?![_]))*[a-z0-9]$')


class AsyncTransport(Extension):
    name = None

    @classmethod
    def sanitize(cls):
        if cls.__name__ == 'AsyncTransport':
            return
        assert cls.name is not None, 'name not specified'

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    def __init__(self, uri_parts):
        self.location = uri_parts.netloc
        self.path = uri_parts.path
        self.options = parse_qs(uri_parts.query)
        for key, value in self.options.items():
            self.options[key] = value[0]
        self.initialize()

    def initialize(self):
        pass

    def is_valid_name(self, name):
        if RE_QUEUE_NAME.match(name):
            return True
        return False

    def ensure_valid_name(self, name):
        if not self.is_valid_name(name):
            raise ValueError(
                '"%s" is not a properly-formatted queue name' % (
                    name,
                )
            )

    _PAYLOAD_VALIDATOR = MaybeVal(MapVal())

    def encode_payload(self, payload):
        payload = AsyncTransport._PAYLOAD_VALIDATOR(payload) or {}
        payload = json.dumps(payload)
        return payload

    def decode_payload(self, payload):
        if isinstance(payload, basestring):
            payload = json.loads(payload)
        return payload

    def submit_task(self, queue_name, payload):
        raise NotImplementedError()

    def get_task(self, queue_name):
        raise NotImplementedError()

