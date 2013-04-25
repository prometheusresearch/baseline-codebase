#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .context import get_rex
import threading
import functools


class Cache(dict):
    # Per-application cache.

    __slots__ = ('_lock',)

    def __init__(self):
        self._lock = threading.RLock()

    def set_default_cb(self, key, callback):
        # Get the cached value associated with the key; call `callback()` to
        # get the value for a new key.
        with self._lock:
            if key not in self:
                self[key] = callback()
        return self[key]


def cached(fn):
    """Memorizes the function result in the cache of the active application."""
    @functools.wraps(fn)
    def wrapper(*args):
        cache = get_rex().cache
        key = (fn,) + args
        try:
            return cache[key]
        except KeyError:
            return cache.set_default_cb(key, lambda fn=fn, args=args: fn(*args))
    return wrapper


