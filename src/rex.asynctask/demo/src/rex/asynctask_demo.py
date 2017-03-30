#
# Copyright (c) 2015, Prometheus Research, LLC
#


import sys

from rex.asynctask import AsyncTaskWorker
from rex.core import Error
from rex.ctl import Task, RexTask, log


__all__ = (
    'FooWorker',
    'BarWorker',
    'BazWorker',
    'ErrorWorker',
    'FragileWorker',
    'RequeueWorker',
    'NoisyTask',
    'QuietTask',
    'CrashyTask',
)


class FooWorker(AsyncTaskWorker):
    name = 'demo_foo_worker'

    def process(self, payload):
        print 'FOO processed: %r' % (payload,)


class BarWorker(AsyncTaskWorker):
    name = 'demo_bar_worker'

    def process(self, payload):
        print 'BAR processed: %r' % (payload,)


class BazWorker(AsyncTaskWorker):
    name = 'demo_baz_worker'

    def process(self, payload):
        print 'BAZ processed: %r' % (payload,)


class LoggingWorker(AsyncTaskWorker):
    name = 'demo_logging_worker'

    def process(self, payload):
        self.logger.info('Logging Worker received: %r', payload)


class QuietWorker(AsyncTaskWorker):
    name = 'demo_quiet_worker'

    def process(self, payload):
        pass


class ErrorWorker(AsyncTaskWorker):
    name = 'demo_error_worker'

    def process(self, payload):
        if payload['error']:
            raise Exception('Oops!')
        print 'ERROR processed: %r' % (payload,)


class FragileWorker(AsyncTaskWorker):
    name = 'demo_fragile_worker'

    def process(self, payload):
        if payload['die']:
            print 'FRAGILE DYING!'
            sys.exit()
        print 'FRAGILE processed: %r' % (payload,)


class RequeueWorker(AsyncTaskWorker):
    name = 'requeue_worker'

    def process(self, payload):
        print 'REQUEUE processed: %r' % (payload,)
        if payload['foo'] == 1:
            self.requeue({'foo': 2})
            print 'REQUEUE requeued'


class NoisyTask(RexTask):
    """
    A task that says hello.
    """

    name = 'demo-noisy-task'

    def __call__(self):
        with self.make(ensure=False):
            log('Hello world!')


class QuietTask(Task):
    """
    A task that does nothing and says nothing.
    """

    name = 'demo-quiet-task'

    def __call__(self):
        return


class CrashyTask(Task):
    """
    A task that instantly crashes.
    """

    name = 'demo-crashy-task'

    def __call__(self):
        raise Error('Oops, I crashed')

