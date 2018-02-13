#
# Copyright (c) 2015, Prometheus Research, LLC
#


import time

from ratelimiter import RateLimiter

from rex.core import Extension, get_settings
from rex.logging import get_logger

from .core import get_transport


__all__ = (
    'AsyncTaskWorker',
)


class NoOpLimiter(object):
    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


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
        self._transport = None
        self._queue_name = None

    def __call__(self, conn, queue_name):
        self.logger.info('Starting; queue=%s', queue_name)
        self._transport = get_transport()
        self._queue_name = queue_name

        sleep_duration = self.get_poll_interval() / 1000.0
        limiter = self.get_limiter()

        while not check_for_termination(conn):
            with limiter:
                payload = self._transport.get_task(queue_name)
            if payload is not None:
                self.logger.debug('Got payload: %r', payload)
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
                except KeyboardInterrupt:  # pragma: no cover
                    pass

        self._queue_name = None
        self._transport = None
        self.logger.info('Terminating')

    def _throttled(self, until):
        self.logger.debug(
            'Rate limited on queue %s, sleeping for %f seconds',
            self._queue_name,
            until - time.time(),
        )

    def get_limiter(self):
        """
        Returns a ContextManager that is responsible for performing any
        necessary rate limiting logic.

        :rtype: ContextManager
        """

        cfg = get_settings().asynctask_workers.get(self._queue_name)
        if not cfg \
                or cfg.rate_max_calls is None \
                or cfg.rate_period is None:
            return NoOpLimiter()

        return RateLimiter(
            max_calls=cfg.rate_max_calls,
            period=cfg.rate_period,
            callback=self._throttled,
        )

    def get_poll_interval(self):
        """
        Returns the number of milliseconds to wait between attempts to retrieve
        tasks from the queue.

        :rtype: int
        """

        # pylint: disable=no-self-use

        return get_settings().asynctask_workers_poll_interval

    def process(self, payload):
        """
        Called when a task is received on the queue.

        Must be implemented by concrete classes.

        :param payload: the payload of the task
        :type payload: dict
        """

        raise NotImplementedError()

    def requeue(self, payload):
        """
        A convenience method for resubmitting a payload back into the queue.

        :param payload: the payload to resubmit.
        :type payload: dict
        """

        if self._transport and self._queue_name:
            self._transport.submit_task(self._queue_name, payload)
        self.logger.debug('Requeued payload: %r', payload)


def check_for_termination(comm):
    if comm.poll():
        msg = comm.recv()
        return msg == 'QUIT'
    return False

