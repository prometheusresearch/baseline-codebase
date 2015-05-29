
from rex.asynctask import AsyncTaskWorker


class FooWorker(AsyncTaskWorker):
    name = 'demo_foo_worker'

    def process(self, payload):
        print 'FOO processed: %r' % (payload,)

