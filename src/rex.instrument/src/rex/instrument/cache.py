import threading

from collections import defaultdict
from functools import wraps


__all__ = (
    'InterfaceCache',
    'interface_cache',
    'cached_get',
)


_LOCAL = threading.local()


class InterfaceCache(object):
    """
    A context manager that provides a simple shared caching mechanism for
    rex.instrument (and related) interface implementations.
    """

    def __enter__(self):
        return self.on()

    def __exit__(self, exc_type, exc_value, traceback):
        self.off()

    # pylint: disable=C0103
    def on(self):
        """
        Allows you to activate the cache context without the use of ``with``.

        :returns: the instance of InterfaceCache
        """

        if not hasattr(_LOCAL, 'acquire_orm_cache'):
            _LOCAL.acquire_orm_cache_depth = 0
            self._reset_cache()

        _LOCAL.acquire_orm_cache_depth += 1
        return self

    def off(self):
        """
        Allows you to deactivate the cache context outside the use of ``with``.
        """

        _LOCAL.acquire_orm_cache_depth -= 1
        if _LOCAL.acquire_orm_cache_depth == 0:
            self._reset_cache()

    # pylint: disable=R0201
    def _reset_cache(self):
        _LOCAL.acquire_orm_cache = defaultdict(dict)

    # pylint: disable=R0201
    @property
    def _cache(self):
        return _LOCAL.acquire_orm_cache

    def get(self, bucket, key):
        """
        Returns the value stored in the specified bucket/key.

        :param bucket: the group the key is in
        :type bucket: string
        :param key: the key of the value to retrieve
        :type key: string
        :returns: the value stored in bucket/key; None if no value exists
        """

        return self._cache[bucket].get(key, None)

    def set(self, bucket, key, value):
        """
        Stores a value in the specified bucket/key.

        :param bucket: the group to store the key in
        :type bucket: string
        :param key:
            the unique key (within the scope of a bucket) to store the value
            as
        :type key: string
        """

        self._cache[bucket][key] = value

    def has(self, bucket, key):
        """
        Checks to see if a value has been stored in the specified bucket/key.

        :param bucket: the group to search for the key in
        :type bucket: string
        :param key: the key to check for
        :type key: string
        :returns: true if the bucket/key has a value; false otherwise
        """

        return key in self._cache[bucket]


def interface_cache(func):
    """
    A decorator that enables the cache context for the duration of the
    function call.
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        with InterfaceCache():
            return func(*args, **kwargs)

    return wrapper


def cached_get(bucket):
    """
    A decorator that acts as a memoizer for one of the standard ``get_by_*``
    methods on an Interface object. The decorated function will treat the
    first argument as the ``key`` in the cache bucket to use.

    :param bucket: the bucket to place the memoized values in
    :type bucket: string
    """

    def decorator(func):
        @wraps(func)
        def wrapper(self, key, *args, **kwargs):
            with InterfaceCache() as cache:
                if not cache.has(bucket, key):
                    value = func(self, key, *args, **kwargs)
                    if value is not None:
                        cache.set(bucket, key, value)
                return cache.get(bucket, key)
        return wrapper
    return decorator

