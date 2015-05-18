"""

    rex.widget.transitionable
    =========================

    This modules provides a way to define transitionable objects. Objects which
    can be passed to another execution environment in an efficient way.

    :copyright: 2015, Prometheus Research, LLC

"""

import inspect
import threading
import contextlib
from StringIO import StringIO

from rex.core import Record

from transit.writer import Writer
from transit.write_handlers import WriteHandler as BaseWriteHandler

__all__ = (
    'Transitionable', 'TransitionableRecord',
    'as_transitionable', 'register_transitionable',
    'encode')


class WriteHandler(BaseWriteHandler):

    def __getitem__(self, key):
        key = key if isinstance(key, type) else type(key)
        if key in self.store:
            return self.store[key]
        else:
            for t in key.mro():
                value = t in self.store and self.store[t]
                if value:
                    return value
            raise KeyError("No handler found for: " + str(key))


_data = threading.local()
_handlers = WriteHandler()


@contextlib.contextmanager
def _request(req):
    _data.request = req
    try:
        yield
    finally:
        del _data.request


class _Handler(object):

    def __init__(self, tag, rep):
        self._tag = tag
        self._rep = rep
        self.string_rep = rep

    def rep(self, value):
        return self._rep(value)

    def tag(self, _):
        return self._tag

    def __repr__(self):
        return '<%s.%s>' % (
            self.__class__.__module__,
            self.__class__.__name__)


class _RequestContextHandler(_Handler):

    def rep(self, value):
        req = _data.request
        return self._rep(value, req)


def register_transitionable(obj_type, rep, tag=None):
    if tag is None:
        tag = '%s.%s' % (obj_type.__module__, obj_type.__name__)
    argspec = inspect.getargspec(rep)
    if len(argspec.args) == 1:
        handler = _Handler(tag, rep)
    else:
        handler = _RequestContextHandler(tag, rep)
    _handlers[obj_type] = handler
    return handler


def encode(obj, request):
    """ Encode transitionable ``obj`` in the context of ``request`` into a
    serialized representation.

    :param obj: Transitionable object to encode
    :param request: WSGI request
    """
    io = StringIO()
    writer = Writer(io, 'json')
    writer.marshaler.handlers = _handlers
    with _request(request):
        writer.write(obj)
    return io.getvalue()


class _TransitionableMeta(type):

    def __new__(mcs, name, bases, attrs):
        cls = type.__new__(mcs, name, bases, attrs)
        if '__transit_format__' in attrs:
            tag = attrs.get('__transit_tag__', '%s.%s' % (attrs['__module__'], name))
        elif hasattr(cls, '__transit_tag__'):
            tag = cls.__transit_tag__
        else:
            return cls
        argspec = inspect.getargspec(cls.__transit_format__.im_func)
        if len(argspec.args) == 1:
            handler = _Handler(tag, cls.__transit_format__.im_func)
        else:
            handler = _RequestContextHandler(tag, cls.__transit_format__.im_func)
        _handlers[cls] = handler
        return cls


class Transitionable(object):
    """ Base class for transitionable objects."""

    __metaclass__ = _TransitionableMeta

    def __transit_format__(self):
        raise NotImplementedError('%s.__transit_format__() is not implemented' % \
                                  self.__class__.__name__)

    def __str__(self):
        return super(Transitionable, self).__str__()


class _TransitionableRecordMeta(_TransitionableMeta):

    def __new__(mcs, name, bases, attrs):
        fields = attrs.pop('fields', None)
        if fields is None:
            for base in bases:
                if hasattr(base, '_fields') and base._fields is not None:
                    fields = base._fields
                    break
        else:
            bases = bases + (Record.make(name, fields),)
        if fields is not None:
            attrs['__slots__'] = attrs['_fields'] = tuple(fields)
        return _TransitionableMeta.__new__(mcs, name, bases, attrs)


class TransitionableRecord(Transitionable):

    __metaclass__ = _TransitionableRecordMeta

    def __transit_format__(self):
        return [getattr(self, field) for field in self._fields]


def as_transitionable(obj_type, tag=None):
    """ Decorator to attach transit format externally to an object type."""
    def _register(rep):
        register_transitionable(obj_type, rep, tag=tag)
        return rep
    return _register
