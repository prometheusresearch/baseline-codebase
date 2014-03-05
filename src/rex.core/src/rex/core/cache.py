#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from .context import get_rex
import threading
import functools
import inspect
import textwrap
import os


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


class OpenSpy(object):
    # An utility for loading data from a file and caching the result.  Rebuilds
    # the result whenever any of the source files changes.
    # NOTE: not resistant to race conditions -- use only to enable development
    # without restarting the server.

    def __init__(self, callback, *args):
        # Function that generates the result.  Must have a parameter called
        # `open`.
        self.callback = callback
        # Arguments to the function.
        self.args = args
        # Set of source files.
        self.paths = []
        # Time of the last update of the files from this set.
        self.last_modified = 0
        # The total size of all opened files.
        self.total_size = 0
        # Cached data.
        self.result = None
        self.lock = threading.Lock()

    def open(self, path):
        # Opens the file; notes the time of the last update and
        # updates the total size.
        stream = open(path)
        if path not in self.paths:
            self.paths.append(path)
            stat = os.fstat(stream.fileno())
            self.last_modified = max(self.last_modified, stat.st_mtime)
            self.total_size += stat.st_size
        return stream

    def __call__(self):
        with self.lock:
            # Check if we can use the cached result.
            if self.paths:
                try:
                    last_modified = 0
                    total_size = 0
                    for path in self.paths:
                        stat = os.stat(path)
                        last_modified = max(last_modified, stat.st_mtime)
                        total_size = stat.st_size
                    if (last_modified, total_size) == \
                            (self.last_modified, self.total_size):
                        return self.result
                except OSError:
                    pass
            # If not, generate and cache the result.
            self.paths = []
            self.last_modified = 0
            self.total_size = 0
            try:
                self.result = self.callback(*self.args, open=self.open)
            except:
                self.paths = []
                self.last_modified = 0
                self.total_size = 0
                raise
            return self.result


def cached(fn):
    """
    Decorates the function to cache its return values.

    For a fixed set of arguments, on the first call, saves the return value
    in the cache of the current active application.  On subsequent calls,
    returns the cached value without reevaluating the function.
    """
    spec = inspect.getargspec(fn)
    assert (spec.keywords is None and
            spec.defaults is None and
            not any(arg.startswith('_') for arg in spec.args)), \
                    "cached function may only have positional arguments" \
                    " with no default values: %s" % repr(spec)
    # For each wrapped function, compile a custom wrapper to get nice tracebacks
    # and correct argument names in autogenerated documentation.
    name = 'cached_%s' % fn.__name__
    params = spec.args[:]
    key = spec.args[:]
    if spec.varargs is not None:
        params.append('*'+spec.varargs)
        key.append(spec.varargs)
    lineno = cached.__code__.co_firstlineno + 23    # from `def` to `source`
    source = "\n"*lineno + textwrap.dedent("""\
        def {name}({params}):
            _cache = _get_rex().cache
            _key = (_fn, {key})
            try:
                return _cache[_key]
            except KeyError:
                return _cache.set_default_cb(_key, _fn, {params})
    """).format(name=name, params=", ".join(params), key=", ".join(key))
    filename = cached.__code__.co_filename
    code = compile(source, filename, 'exec')
    context = {
            '_fn': fn,
            '_get_rex': get_rex,
    }
    exec code in context
    wrapper = context.pop(name)
    functools.update_wrapper(wrapper, fn)
    return wrapper


def autoreload(fn):
    """
    Decorates the function that loads data from a file to cache its return
    values.  Rebuilds the result if any of the source files changes.

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
    # For each wrapped function, compile a custom wrapper to get nice tracebacks
    # and correct argument names in autogenerated documentation.
    name = 'autoreload_%s' % fn.__name__
    params = spec.args[:-1]
    lineno = autoreload.__code__.co_firstlineno + 21    # from `def` to `source`
    source = "\n"*lineno + textwrap.dedent("""\
        def {name}({params}):
            _cache = _get_rex().cache
            _key = (_fn, {params})
            try:
                _spy = _cache[_key]
            except KeyError:
                _spy = _cache.set_default_cb(_key, _OpenSpy, _fn, {params})
            return _spy()
    """).format(name=name, params=", ".join(params))
    filename = cached.__code__.co_filename
    code = compile(source, filename, 'exec')
    context = {
            '_fn': fn,
            '_get_rex': get_rex,
            '_OpenSpy': OpenSpy,
    }
    exec code in context
    wrapper = context.pop(name)
    functools.update_wrapper(wrapper, fn)
    return wrapper


