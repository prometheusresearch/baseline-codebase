#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .context import active_app
import threading
import functools


class Cache(object):
    # Per-application cache.

    def __init__(self):
        self._values = {}
        self._lock = threading.RLock()

    def get_or_set(self, key, callback):
        # Get the cached value associated with the key; call `callback` for
        # an unknown key.
        try:
            return self._values[key]
        except KeyError:
            with self._lock:
                if key not in self._values:
                    self._values[key] = callback()
            return self._values[key]


def cached(fn):
    """Memorizes function result in the cache of the active application."""
    @functools.wraps(fn)
    def wrapper(*args):
        cache = active_app.cache
        key = (fn,) + args
        return cache.get_or_set(key, lambda args=args: fn(*args))
    return wrapper


