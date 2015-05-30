#
# Copyright (c) 2015, Prometheus Research, LLC
#


from collections import defaultdict
from contextlib import contextmanager
from threading import Lock

from .base import AsyncTransport


__all__ = (
    'LocalMemoryAsyncTransport',
)


class LocalMemoryAsyncTransport(AsyncTransport):
    """
    tbd
    """

    name = 'localmem'

    def initialize(self):
        self._queues = defaultdict(list)
        self._locks = defaultdict(Lock)

    def submit_task(self, queue_name, payload):
        self.ensure_valid_name(queue_name)
        payload = self.encode_payload(payload)

        with self._lock(queue_name):
            self._queues[queue_name].append(payload)

    def get_task(self, queue_name):
        self.ensure_valid_name(queue_name)
        payload = None

        with self._lock(queue_name):
            try:
                payload = self.decode_payload(self._queues[queue_name].pop(0))
            except IndexError:
                pass

        return payload

    @contextmanager
    def _lock(self, name):
        self._locks[name].acquire()
        try:
            yield
        finally:
            self._locks[name].release()

