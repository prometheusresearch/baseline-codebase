"""

    rex.widget.transitionable
    =========================

    This modules provides a way to define transitionable objects. Objects which
    can be passed to another execution environment in an efficient way.

    :copyright: 2015, Prometheus Research, LLC

"""

from io import StringIO

from rex.core import Record

from transit.constants import ESC
from transit.writer import Writer as BaseWriter
from transit.writer import JsonMarshaler as BaseJsonMarshaler
from transit.writer import marshal_dispatch as base_marshal_dispatch
from transit.write_handlers import WriteHandler as BaseWriteHandler

__all__ = (
    'Transitionable', 'TransitionableRecord',
    'as_transitionable', 'register_transitionable',
    'encode', 'select', 'SelectError'
)


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

    def __init__(self, io, request, opts=None):
        opts = opts or {}
        super(JsonMarshaler, self).__init__(io, opts=opts)
        self.request = request
        self.handlers = _handlers
        self.path = []

    def marshal(self, obj, as_map_key, cache):
        handler = self.handlers[obj]
        tag = handler.tag(obj)
        f = marshal_dispatch.get(tag)

        if as_map_key:
            rep = handler.string_rep(obj)
        elif isinstance(handler, _Handler):
            rep = handler.rep(obj, self.request, self.path[:])
        else:
            rep = handler.rep(obj)

        if f:
            f(self, rep, as_map_key, cache)
        else:
            self.emit_encoded(tag, rep, obj, as_map_key, cache)

    def emit_encoded(self, tag, rep, obj, as_map_key, cache):
        if len(tag) == 1:
            if isinstance(rep, str):
                self.emit_string(ESC, tag, rep, as_map_key, cache)
            elif as_map_key or self.opts["prefer_strings"]:
                if isinstance(rep, str):
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
                self.io.write(": ")
                self.is_key[-1] = False
            elif last is False:
                self.io.write(", ")
                self.is_key[-1] = True
            else:
            #elif last is None:
                self.io.write(", ")

    def emit_array(self, a, _, cache):
        self.emit_array_start(len(a))
        for i, x in enumerate(a):
            with self._PathContext(self, i):
                self.marshal(x, False, cache)
        self.emit_array_end()

    def emit_map(self, m, _, cache):# use map as object from above, have to overwrite default parser.
        self.emit_map_start(len(m))
        for k, v in list(m.items()):
            self.marshal(k, True, cache)
            with self._PathContext(self, k):
                self.marshal(v, False, cache)
        self.emit_map_end()


marshal_dispatch = base_marshal_dispatch.copy()
marshal_dispatch['array'] = JsonMarshaler.emit_array
marshal_dispatch[NOOP_TAG] = lambda self, rep, as_map_key, cache: JsonMarshaler.marshal(self, rep, as_map_key, cache)


class Writer(BaseWriter):

    def __init__(self, io, request):
        self.marshaler = JsonMarshaler(io, request, opts={'cache_enabled': True})


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


_handlers = WriteHandler()


class SelectError(LookupError):
    """ Error while selecting the subpart of the transitionable."""

    def __init__(self, key):
        self.key = key
        LookupError.__init__(self, str(key))


def select(obj, req, path):
    return _select(obj, req, path, [])

def _select(obj, req, path, _path):
    """ Select a subwidget from a ``widget`` hierarchy by ``path``."""
    if not path:
        return obj
    x, xs = path[0], path[1:]
    handler = _handlers[obj]
    tag = handler.tag(obj)
    if isinstance(handler, _Handler):
        rep = handler.rep(obj, req, _path[:])
    else:
        rep = handler.rep(obj)
    if tag == 'map':
        try:
            rep = rep[x]
        except KeyError:
            raise SelectError(x)
        return _select(rep, req, xs, _path + [x])
    elif tag == 'array':
        try:
            rep = rep[x]
        except TypeError:
            raise SelectError(x)
        except IndexError:
            raise SelectError(x)
        except KeyError:
            raise SelectError(x)
        return _select(rep, req, xs, _path + [x])
    elif tag in marshal_dispatch and not tag == NOOP_TAG:
        return _select(rep, req, xs, _path)
    else:
        return _select(rep, req, path, _path)


class _Handler(object):

    def __init__(self, tag, rep):
        self._tag = tag
        self.rep = rep
        self.string_rep = rep

    def tag(self, _):
        return self._tag

    def __repr__(self):
        return '<%s.%s>' % (
            self.__class__.__module__,
            self.__class__.__name__)


def register_transitionable(obj_type, rep, tag=NOOP_TAG):
    handler = _Handler(tag, rep)
    _handlers[obj_type] = handler
    return handler


def encode(obj, request):
    """ Encode transitionable ``obj`` in the context of ``request`` into a
    serialized representation.

    :param obj: Transitionable object to encode
    :param request: WSGI request
    """
    io = StringIO()
    writer = Writer(io, request)
    writer.write(obj)
    return io.getvalue()


class _TransitionableMeta(type):

    def __new__(mcs, name, bases, attrs):
        cls = type.__new__(mcs, name, bases, attrs)
        tag = getattr(cls, '__transit_tag__', NOOP_TAG)
        register_transitionable(cls, cls.__transit_format__.__func__, tag=tag)
        return cls


class Transitionable(object, metaclass=_TransitionableMeta):
    """ Base class for transitionable objects."""

    def __transit_format__(self, req, path):
        raise NotImplementedError(
            '%s.__transit_format__(req, path) is not implemented' % \
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


class TransitionableRecord(Transitionable, metaclass=_TransitionableRecordMeta):

    def __transit_format__(self, req, path):
        return [getattr(self, field) for field in self._fields] # pylint: disable=no-member


def as_transitionable(obj_type, tag=NOOP_TAG):
    """ Decorator to attach transit format externally to an object type."""
    def _register(rep):
        register_transitionable(obj_type, rep, tag=tag)
        return rep
    return _register


@as_transitionable(Record, tag='map')
def _format_Record(value, req, path):
    return value._asdict()
