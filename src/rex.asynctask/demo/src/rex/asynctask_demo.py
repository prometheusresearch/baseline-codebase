#
# Copyright (c) 2015, Prometheus Research, LLC
#


import sys

from rex.asynctask import AsyncTaskWorker


__all__ = (
    'FooWorker',
    'ErrorWorker',
    'FragileWorker',
)


class FooWorker(AsyncTaskWorker):
    name = 'demo_foo_worker'

    def process(self, payload):
        print 'FOO processed: %r' % (payload,)


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

