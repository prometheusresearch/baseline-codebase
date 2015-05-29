#
# Copyright (c) 2015, Prometheus Research, LLC
#


import time

from rex.core import Extension, get_settings
from rex.logging import get_logger

from .core import get_transport


__all__ = (
    'AsyncTaskWorker',
)


class AsyncTaskWorker(Extension):
    name = None

    @classmethod
    def sanitize(cls):
        if cls.__name__ == 'AsyncTaskWorker':
            return
        assert cls.name is not None, 'name not specified'

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    def __init__(self):
        self.logger = get_logger(self)

    def _check_for_termination(self, comm):
        if comm.poll():
            msg = comm.recv()
            return msg == 'QUIT'
        return False

    def __call__(self, conn, queue_name):
        self.logger.info('Starting; queue=%s', queue_name)
        transport = get_transport()

        while not self._check_for_termination(conn):
            payload = transport.get_task(queue_name)
            if payload is not None:
                self.logger.debug('Got payload: %r' % (payload,))
                try:
                    self.process(payload)
                except Exception:  # pylint: disable=broad-except
                    self.logger.exception(
                        'An unhandled exception occurred while processing the payload'
                    )
                else:
                    self.logger.debug('Processing complete')

            else:
                # No task to process, let's sleep a bit.
                try:
                    time.sleep(self.get_poll_interval() / 1000.0)
                except KeyboardInterrupt:  # pylint: disable=pointless-except
                    pass

        self.logger.info('Terminating')

    def get_poll_interval(self):
        return get_settings().asynctask_workers_poll_interval

    def process(self, payload):
        raise NotImplementedError()

