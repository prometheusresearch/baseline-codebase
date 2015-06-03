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
    """
    This is an extension to implement task-processing logic that is launched
    and coordinated by the ``asynctask-workers`` rex.ctl task in this package.
    """

    #: The name of the worker as referred to in the asynctask_workers setting.
    name = None

    @classmethod
    def sanitize(cls):
        if cls.enabled():
            assert cls.process != AsyncTaskWorker.process, \
                '%s.process() method not implemented' % cls

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    def __init__(self):
        self.logger = get_logger(self)

    def __call__(self, conn, queue_name):
        self.logger.info('Starting; queue=%s', queue_name)

        transport = get_transport()
        sleep_duration = self.get_poll_interval() / 1000.0

        while not check_for_termination(conn):
            payload = transport.get_task(queue_name)
            if payload is not None:
                self.logger.debug('Got payload: %r' % (payload,))
                try:
                    self.process(payload)
                except Exception:  # pylint: disable=broad-except
                    self.logger.exception(
                        'An unhandled exception occurred while processing the'
                        ' payload'
                    )
                else:
                    self.logger.debug('Processing complete')

            else:
                # No task to process, let's sleep a bit.
                try:
                    time.sleep(sleep_duration)
                except KeyboardInterrupt:  # pylint: disable=pointless-except
                    pass

        self.logger.info('Terminating')

    def get_poll_interval(self):
        """
        Returns the number of milliseconds to wait between attempts to retrieve
        tasks from the queue.

        :rtype: int
        """

        return get_settings().asynctask_workers_poll_interval

    def process(self, payload):
        """
        Called when a task is received on the queue.

        Must be implemented by concrete classes.

        :param payload: the payload of the task
        :type payload: dict
        """

        raise NotImplementedError()


def check_for_termination(comm):
    if comm.poll():
        msg = comm.recv()
        return msg == 'QUIT'
    return False

