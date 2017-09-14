#
# Copyright (c) 2017, Prometheus Research, LLC
#

from urlparse import urlunparse

from rex.core import Error

from .base import AsyncTransport


__all__ = (
    'AmqpAsyncTransport',
)


class AmqpAsyncTransport(AsyncTransport):
    """
    An implementation of AsyncTransport that uses AMQP servers to store tasks
    while they're in a queue.

    Transport URI Examples:

    * amqp://user:password@hostname
    * amqp://user:password@hostname:port
    * amqp://user:password@hostname:port/vhost
    """

    #:
    name = 'amqp'

    def __init__(self, uri_parts):
        self._connection_string = urlunparse(uri_parts)
        super(AmqpAsyncTransport, self).__init__(uri_parts)

    def initialize(self):
        try:
            from kombu import Connection
            self._conn = Connection(self._connection_string)
            self._conn.connect()
        except Exception as exc:
            raise Error(
                'Failed to connect to the AMQP server:',
                exc,
            )
        self._queues = {}

    def _get_queue(self, queue_name):
        self.ensure_valid_name(queue_name)
        if queue_name not in self._queues:
            self._queues[queue_name] = self._conn.SimpleQueue(
                queue_name,
                no_ack=True,
            )
        return self._queues[queue_name]

    def submit_task(self, queue_name, payload):
        queue = self._get_queue(queue_name)
        payload = self.encode_payload(payload)
        queue.put(payload)

    def get_task(self, queue_name):
        queue = self._get_queue(queue_name)
        try:
            payload = queue.get(block=False).body
        except queue.Empty:
            return None
        return self.decode_payload(payload)

    def poll_queue(self, queue_name):
        queue = self._get_queue(queue_name)
        return queue.qsize()

    def __repr__(self):
        return '%s(%s)' % (
            self.__class__.__name__,
            self._connection_string,
        )

