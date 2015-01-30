#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from .context import get_rex
import threading
import functools
import inspect
import textwrap
import os
import time


class Cache(dict):
    # Application cache.

    __slots__ = ('_lock',)

    def __init__(self):
        self._lock = threading.RLock()

    def set_default_cb(self, key, callback, *args):
        # Get the cached value associated with the key; call `callback()` to
        # get the value for a new key.
        with self._lock:
            if key not in self:     # might have been set in another thread
                self[key] = callback(*args)
        return self[key]


class OpenGate(object):
    # An utility for loading data from a file and caching the result.  Rebuilds
    # the result whenever any of the source files changes.
    # NOTE: not resistant to race conditions -- use only to enable development
    # without restarting the server.

    __slots__ = ('callback', 'args', 'result', 'version')

    # Global dictionary that maps file names to their stats.
    stats = {}
    stats_version = 1
    stats_lock = threading.RLock()

    def __init__(self, callback, *args):
        # Function that generates the result.  Must have a parameter called
        # `open`.
        self.callback = callback
        # Arguments to the function.
        self.args = args
        # Cached data.
        self.result = None
        # The version of the data.
        self.version = 0

    def open(self, path):
        # Opens the file; saves its stats.
        stream = open(path)
        path = os.path.abspath(path)
        if path not in OpenGate.stats:
            OpenGate.stats[path] = os.fstat(stream.fileno()).st_mtime
        return stream

    def __call__(self):
        with OpenGate.stats_lock:
            # Check if we can use the cached result.
            if self.version > 0:
                stats = {}
                for path in OpenGate.stats.keys():
                    try:
                        stats[path] = os.stat(path).st_mtime
                    except OSError:
                        pass
                if stats == OpenGate.stats:
                    if self.version == OpenGate.stats_version:
                        return self.result
                else:
                    OpenGate.stats = stats
                    OpenGate.stats_version += 1
            # If not, generate and cache the result.
            self.result = self.callback(*self.args, open=self.open)
            self.version = OpenGate.stats_version
            return self.result


class ExpireGate(object):
    # An utility that expires function result after a period of time.

    __slots__ = ('callback', 'args', 'expires', 'timestamp', 'result', 'lock')

    def __init__(self, callback, *args):
        self.callback = callback
        self.args = args
        self.expires = callback.expires
        self.timestamp = -self.expires
        self.result = None
        self.lock = threading.RLock()

    def __call__(self):
        with self.lock:
            timestamp = time.time()
            if self.timestamp+self.expires < timestamp:
                self.result = self.callback(*self.args)
                self.timestamp = timestamp
            return self.result


def _decorate(fn, Gate=None, prefix='cached_', spec=None):
    # Returns a decorated function which value is stored in the application
    # cache.  If `Gate` is provided, use it as the value container.
    if spec is None:
        spec = inspect.getargspec(fn)
    assert (spec.keywords is None and
            not any(arg.startswith('_') for arg in spec.args)), \
                    "cached function may only have positional arguments: %s" \
                    % repr(spec)
    # For each wrapped function, compile a custom wrapper to get nice tracebacks
    # and correct argument names in autogenerated documentation.
    name = prefix + fn.__name__
    params = spec.args[:]
    if spec.defaults:
        k = len(spec.defaults)
        signature = params[:-k]
        for param, default in zip(params[-k:], spec.defaults):
            default = getattr(default, '__name__', repr(default))
            signature.append("%s=%s" % (param, default))
    else:
        signature = params[:]
    key = spec.args[:]
    if spec.varargs is not None:
        params.append('*'+spec.varargs)
        signature.append('*'+spec.varargs)
        key.append(spec.varargs)
    if Gate is None:
        lineno = _decorate.__code__.co_firstlineno + 28 # from `def` to `source`
        source = """\
            def {name}({signature}):
                _cache = _get_rex().cache
                _key = (_fn, {key})
                try:
                    return _cache[_key]
                except KeyError:
                    return _cache.set_default_cb(_key, _fn, {params})
        """
    else:
        lineno = _decorate.__code__.co_firstlineno + 39 # from `def` to `source`
        source = """\
            def {name}({signature}):
                _cache = _get_rex().cache
                _key = (_fn, {key})
                try:
                    _gate = _cache[_key]
                except KeyError:
                    _gate = _cache.set_default_cb(_key, _Gate, _fn, {params})
                return _gate()
        """
    source = "\n"*lineno + textwrap.dedent(source)
    source = source.format(name=name, signature=", ".join(signature),
                           params=", ".join(params), key=", ".join(key))
    filename = _decorate.__code__.co_filename
    code = compile(source, filename, 'exec')
    context = {
            '_fn': fn,
            '_get_rex': get_rex,
            '_Gate': Gate,
    }
    exec code in context
    wrapper = context.pop(name)
    functools.update_wrapper(wrapper, fn)
    return wrapper


def cached(fn=None, expires=None):
    """
    Decorates the function to cache its return values.

    For a fixed set of arguments, on the first call, saves the return value
    in the cache of the current active application.  On subsequent calls,
    returns the cached value without reevaluating the function.

    If `expires` is set, the cached value is invalidated after the specified
    period (in seconds).
    """
    assert fn is not None or expires is not None
    if fn is not None:
        if expires is None:
            return _decorate(fn)
        else:
            fn.expires = expires
            return _decorate(fn, ExpireGate)
    else:
        return (lambda fn, expires=expires: cached(fn, expires))


def autoreload(fn):
    """
    Decorates the function to cache its return value.  The cached value is
    re-evaluated if any of the files opened by the function change.

    The function must have only positional arguments with the last argument
    being ``open=open``.
    """
    spec = inspect.getargspec(fn)
    assert (spec.args[-1:] == ['open'] and
            spec.defaults == (open,) and
            spec.keywords is None and
            spec.varargs is None and
            not any(arg.startswith('_') for arg in spec.args)), \
                    "auto-reloading function may only have positional arguments" \
                    " with last argument being open=open: %s" % repr(spec)
    # Remove `open=open` from the list of arguments.
    spec = spec.__class__(spec.args[:-1], None, None, None)
    return _decorate(fn, OpenGate, prefix='autoreload_', spec=spec)


