from webob.exc import HTTPPaymentRequired

from rex.core import StrVal, IntVal, RecordVal
from rex.restful import RestfulLocation, SimpleResource
from rex.web import Parameter


class FooResource(RestfulLocation):
    path = '/foo/{foo_id}'
    access = 'anybody'

    parameters = (
        Parameter('foo_id', StrVal()),
    )

    def create(self, request, foo_id, **kwargs):
        print '### CREATING FOO %s' % foo_id
        print '###   PAYLOAD: %s' % request.payload
        return {'foo': foo_id}

    def retrieve(self, request, foo_id, **kwargs):
        print '### RETRIEVING FOO %s' % foo_id
        return {'foo': foo_id}

    def update(self, request, foo_id, **kwargs):
        print '### UPDATING FOO %s' % foo_id
        print '###   PAYLOAD: %s' % request.payload
        return {'foo': foo_id}

    def delete(self, request, foo_id, **kwargs):
        print '### DELETING FOO %s' % foo_id


class ReadOnlyResource(RestfulLocation):
    path = '/bar/{bar_id}'
    access = 'anybody'

    parameters = (
        Parameter('bar_id', StrVal()),
    )

    def retrieve(self, request, bar_id, **kwargs):
        print '### RETRIEVING BAR %s' % bar_id
        return {'bar': bar_id}


class FailingResource(RestfulLocation):
    path = '/fail'
    access = 'anybody'

    def retrieve(self, request, **kwargs):
        raise Exception('This always fails')

    def update(self, request, **kwargs):
        raise HTTPPaymentRequired('Show me the money')


class BazResource(SimpleResource):
    access = 'anybody'
    base_path = '/baz'
    path = '/baz/{baz_id}'
    parameters = (
        Parameter('baz_id', StrVal()),
    )

    def list(self, request, **kwargs):
        print '### RETRIEVING BAZ LIST'
        return [
            {'baz': 1},
            {'baz': 2},
        ]

    def create(self, request, **kwargs):
        print '### CREATING BAZ'
        return {'baz': 'new'}

    def retrieve(self, request, baz_id, **kwarg):
        print '### RETRIEVING BAZ %s' % baz_id
        return {'baz': baz_id}

    def update(self, request, baz_id, **kwarg):
        print '### UPDATING BAZ %s' % baz_id
        return {'baz': baz_id}

    def delete(self, request, baz_id, **kwarg):
        print '### DELETING BAZ %s' % baz_id


class ValidatedPayloadResource(SimpleResource):
    access = 'anybody'
    base_path = '/validate-me'
    path = '/validate-me/{vid}'
    parameters = (
        Parameter('vid', StrVal()),
    )

    create_payload_validator = RecordVal(
        ('foo', StrVal),
        ('bar', StrVal, None),
        ('baz', IntVal),
    )

    update_payload_validator = RecordVal(
        ('foo', StrVal),
        ('bar', StrVal),
        ('baz', IntVal),
        ('blah', IntVal, 123),
    )

    def create(self, request, **kwargs):
        print '### CREATING VID'
        print '###   PAYLOAD: %s' % request.payload
        return {'vid': 'new'}

    def update(self, request, vid, **kwargs):
        print '### UPDATING VID %s' % vid
        print '###   PAYLOAD: %s' % request.payload
        return {'vid': vid}

