from webob.exc import HTTPPaymentRequired

from rex.core import StrVal
from rex.restful import RestfulLocation
from rex.web import Parameter


class FooResource(RestfulLocation):
    path = '/foo/{foo_id}'
    access = 'anybody'

    parameters = (
        Parameter('foo_id', StrVal()),
    )

    def create(self, request, foo_id, **kwarg):
        print '### CREATING FOO %s' % foo_id
        print '###   PAYLOAD: %s' % request.payload
        return {'foo': foo_id}

    def retrieve(self, request, foo_id, **kwarg):
        print '### RETRIEVING FOO %s' % foo_id
        return {'foo': foo_id}

    def update(self, request, foo_id, **kwarg):
        print '### UPDATING FOO %s' % foo_id
        print '###   PAYLOAD: %s' % request.payload
        return {'foo': foo_id}

    def delete(self, request, foo_id, **kwarg):
        print '### DELETING FOO %s' % foo_id


class ReadOnlyResource(RestfulLocation):
    path = '/bar/{bar_id}'
    access = 'anybody'

    parameters = (
        Parameter('bar_id', StrVal()),
    )

    def retrieve(self, request, bar_id, **kwarg):
        print '### RETRIEVING BAR %s' % bar_id
        return {'bar': bar_id}


class FailingResource(RestfulLocation):
    path = '/fail'
    access = 'anybody'

    def retrieve(self, request, **kwarg):
        raise Exception('This always fails')

    def update(self, request, **kwarg):
        raise HTTPPaymentRequired('Show me the money')

