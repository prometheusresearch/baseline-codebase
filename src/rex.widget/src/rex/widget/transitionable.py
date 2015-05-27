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

from transit.writer import Writer as BaseWriter
from transit.writer import JsonMarshaler as BaseJsonMarshaler
from transit.writer import marshal_dispatch as base_marshal_dispatch
from transit.write_handlers import WriteHandler as BaseWriteHandler

__all__ = (
    'Transitionable', 'TransitionableRecord',
    'as_transitionable', 'register_transitionable',
    'encode')


NOOP_TAG = '---'


class JsonMarshaler(BaseJsonMarshaler):

    class _PathContext(object):

        def __init__(self, marshaler, key):
            self.marshaler = marshaler
            self.key = key

        def __enter__(self):
            self.marshaler.path.append(self.key)

        def __exit__(self, exc_type, exc_val, exc_tb):
            self.marshaler.path.pop()

    def __init__(self, io, opts={}):
        super(JsonMarshaler, self).__init__(io, opts=opts)
        self.handlers = _handlers
        self.path = []

    def marshal(self, obj, as_map_key, cache):
        handler = self.handlers[obj]
        tag = handler.tag(obj)
        f = marshal_dispatch.get(tag)

        if as_map_key:
            rep = handler.string_rep(obj)
        elif isinstance(handler, _Handler):
            rep = handler.rep(obj, self.path[:])
        else:
            rep = handler.rep(obj)

        if f:
            f(self, rep, as_map_key, cache)
        else:
            self.emit_encoded(tag, rep, obj, as_map_key, cache)

    def emit_encoded(self, tag, rep, obj, as_map_key, cache):
        if len(tag) == 1:
            if isinstance(rep, basestring):
                self.emit_string(ESC, tag, rep, as_map_key, cache)
            elif as_map_key or self.opts["prefer_strings"]:
                if isinstance(string_rep, basestring):
                    self.emit_string(ESC, tag, rep, as_map_key, cache)
                else:
                    raise AssertionError("Cannot be encoded as string: " + str({"tag": tag,
                                                                                "rep": rep,
                                                                                "obj": obj}))
            else:
                self.emit_tagged(tag, rep, cache)
        elif as_map_key:
            raise AssertionError("Cannot be used as a map key: " + str({"tag": tag,
                                                                        "rep": rep,
                                                                        "obj": obj}))
        else:
            self.emit_tagged(tag, rep, cache)

    def write_sep(self):
        if self.started[-1]:
            self.started[-1] = False
        else:
            last = self.is_key[-1]
            if last:
                self.io.write(u": ")
                self.is_key[-1] = False
            elif last is False:
                self.io.write(u", ")
                self.is_key[-1] = True
            else:
            #elif last is None:
                self.io.write(u", ")

    def emit_array(self, a, _, cache):
        self.emit_array_start(len(a))
        for i, x in enumerate(a):
            with self._PathContext(self, i):
                self.marshal(x, False, cache)
        self.emit_array_end()

    def emit_map(self, m, _, cache):# use map as object from above, have to overwrite default parser.
        self.emit_map_start(len(m))
        for k, v in m.items():
            self.marshal(k, True, cache)
            with self._PathContext(self, k):
                self.marshal(v, False, cache)
        self.emit_map_end()


marshal_dispatch = base_marshal_dispatch.copy()
marshal_dispatch['array'] = JsonMarshaler.emit_array
marshal_dispatch[NOOP_TAG] = lambda self, rep, as_map_key, cache: JsonMarshaler.marshal(self, rep, as_map_key, cache)


class Writer(BaseWriter):

    def __init__(self, io):
        self.marshaler = JsonMarshaler(io, opts={'cache_enabled': True})


class WriteHandler(BaseWriteHandler):

    def __getitem__(self, key):
        key = key if isinstance(key, type) else type(key)
        if key in self.store:
            return self.store[key]
        else:
            for cls in key.mro():
                value = cls in self.store and self.store[cls]
                if value:
                    return value
            raise KeyError("No handler found for: " + str(key))


_data = threading.local()
_handlers = WriteHandler()


def select(obj, req, path):
    with _request(req):
        return _select(obj, req, path, [])

def _select(obj, req, path, _path):
    """ Select a subwidget from a ``widget`` hierarchy by ``path``."""
    if not path:
        return obj
    x, xs = path[0], path[1:]
    handler = _handlers[obj]
    tag = handler.tag(obj)
    if isinstance(handler, _Handler):
        rep = handler.rep(obj, _path[:])
    else:
        rep = handler.rep(obj)
    if tag == 'map':
        return _select(rep[x], req, xs, _path + [x])
    elif tag == 'array':
        return _select(rep[x], req, xs, _path + [x])
    elif tag in marshal_dispatch:
        return _select(rep, req, xs, _path)
    else:
        return _select(rep, req, path, _path)


@contextlib.contextmanager
def _request(req):
    _data.request = req
    try:
        yield
    finally:
        del _data.request


class _Handler(object):

    def __init__(self, tag, rep, need_path=False):
        self._tag = tag
        self._rep = rep
        self.string_rep = rep
        self.need_path = need_path

    def rep(self, value, path):
        if self.need_path:
            return self._rep(value, path=path)
        else:
            return self._rep(value)

    def tag(self, _):
        return self._tag

    def __repr__(self):
        return '<%s.%s>' % (
            self.__class__.__module__,
            self.__class__.__name__)


class _RequestContextHandler(_Handler):

    def rep(self, value, path):
        req = _data.request
        if self.need_path:
            return self._rep(value, req, path=path)
        else:
            return self._rep(value, req)


def register_transitionable(obj_type, rep, tag=NOOP_TAG):
    argspec = inspect.getargspec(rep)
    has_kw = argspec.defaults and len(argspec.defaults) == 1
    if len(argspec.args) == 1 or len(argspec.args) == 2 and has_kw:
        handler = _Handler(tag, rep, need_path=has_kw)
    elif len(argspec.args) == 2 and not has_kw or len(argspec.args) == 3 and has_kw:
        handler = _RequestContextHandler(tag, rep, need_path=has_kw)
    _handlers[obj_type] = handler
    return handler


def encode(obj, request):
    """ Encode transitionable ``obj`` in the context of ``request`` into a
    serialized representation.

    :param obj: Transitionable object to encode
    :param request: WSGI request
    """
    io = StringIO()
    writer = Writer(io)
    with _request(request):
        writer.write(obj)
    return io.getvalue()


class _TransitionableMeta(type):

    def __new__(mcs, name, bases, attrs):
        cls = type.__new__(mcs, name, bases, attrs)
        tag = getattr(cls, '__transit_tag__', NOOP_TAG)
        register_transitionable(cls, cls.__transit_format__.im_func, tag=tag)
        return cls


class Transitionable(object):
    """ Base class for transitionable objects."""

    __metaclass__ = _TransitionableMeta

    def __transit_format__(self):
        raise NotImplementedError(
            '%s.__transit_format__() is not implemented' % \
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
        return [getattr(self, field) for field in self._fields] # pylint: disable=no-member


def as_transitionable(obj_type, tag=NOOP_TAG):
    """ Decorator to attach transit format externally to an object type."""
    def _register(rep):
        register_transitionable(obj_type, rep, tag=tag)
        return rep
    return _register
