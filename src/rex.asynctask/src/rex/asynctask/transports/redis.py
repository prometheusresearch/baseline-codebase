#
# Copyright (c) 2015, Prometheus Research, LLC
#

from __future__ import absolute_import

from redis import StrictRedis

from .base import AsyncTransport


__all__ = (
    'RedisAsyncTransport',
)


class RedisAsyncTransport(AsyncTransport):
    """

    Transport URI Examples:
        redis://hostname
        redis://hostname:port
        redis:///tmp/redis.sock

    Options:
        db
            The database number to connect to. If not specified, defaults to
            0.

        key_prefix
            The string to prepend to the keys used in the database. If not
            defaults to 'asynctask'.
    """

    name = 'redis'

    def initialize(self):
        params = {
            'db': int(self.options.get('db', '0'))
        }
        if self.path:
            params['unix_socket_path'] = self.path
        else:
            parts = self.location.split(':', 1)
            if len(parts) == 2:
                params['host'] = parts[0]
                params['port'] = int(parts[1])
            else:
                params['host'] = parts[0]
        self._redis = StrictRedis(**params)

        self.key_prefix = self.options.get(
            'key_prefix',
            'asynctask',
        )
        self.ensure_valid_name(self.key_prefix)

    def submit_task(self, queue_name, payload):
        self.ensure_valid_name(queue_name)
        queue_name = '_'.join([self.key_prefix, queue_name])
        payload = self.encode_payload(payload)
        self._redis.rpush(queue_name, payload)

    def get_task(self, queue_name):
        self.ensure_valid_name(queue_name)
        queue_name = '_'.join([self.key_prefix, queue_name])
        payload = self.decode_payload(self._redis.lpop(queue_name))
        return payload
