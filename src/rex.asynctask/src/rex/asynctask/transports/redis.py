#
# Copyright (c) 2015, Prometheus Research, LLC
#

from __future__ import absolute_import

from redis import StrictRedis, RedisError

from rex.core import Error

from .base import AsyncTransport


__all__ = (
    'RedisAsyncTransport',
)


class RedisAsyncTransport(AsyncTransport):
    """
    An implementation of AsyncTransport that uses list keys in a Redis database
    to store tasks while they're in a queue.

    Transport URI Examples:

    * redis://hostname
    * redis://hostname:port
    * redis://hostname?option=value
    * redis:///tmp/redis.sock

    Available Options:

        db
            The database number to connect to. If not specified, defaults to
            ``0``.

        key_prefix
            The string to prepend to the keys used in the database. If not
            defaults to ``asynctask``.
    """

    #:
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

        try:
            self._redis = StrictRedis(**params)
            self._redis.ping()
        except RedisError as exc:
            raise Error(
                'Failed to connect to the Redis server:',
                exc,
            )

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

    def poll_queue(self, queue_name):
        self.ensure_valid_name(queue_name)
        queue_name = '_'.join([self.key_prefix, queue_name])
        count = self._redis.llen(queue_name)
        return count

    def __repr__(self):
        return '%s(%s)' % (
            self.__class__.__name__,
            self.path or self.location,
        )

