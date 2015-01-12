"""

    rex.widget.state.util
    =====================

    :copyright: 2014, Prometheus Research, LLC

"""

import re
import time
import contextlib
from collections import MutableMapping
from logging import getLogger

from .json_encoder import register_adapter


log = getLogger(__name__)


@contextlib.contextmanager
def measure_execution_time(message='execution time: %f seconds', log=log):
    """ Measure and log execution time.

    Example::

        with measure_execution_time():
            potentially_expensive_computation()


    :keyword message: Optional message template
    :keyword log: Optional logger
    """
    start = time.clock()
    yield
    end = time.clock()
    log.debug(message, end - start)


class cached_property(object):
    """ Like @property decorator but evaluates its getter only once and caches
    its value."""

    def __init__(self, func, name=None, doc=None):
        self.__name__ = name or func.__name__
        self.__module__ = func.__module__
        self.__doc__ = doc or func.__doc__
        self.func = func

    def __get__(self, obj, type=None):
        if obj is None:
            return self
        value = obj.__dict__.get(self.__name__, NotImplemented)
        if value is NotImplemented:
            value = self.func(obj)
            obj.__dict__[self.__name__] = value
        return value


_to_camelcase_re = re.compile(r'_([a-zA-Z])')

def to_camelcase(value):
    """ Return camelCased version of ``value``."""
    return _to_camelcase_re.sub(lambda m: m.group(1).upper(), value)


class PropsContainer(MutableMapping):
    """ Widget description props container.
    
    This is thin wrapper for dict which automatically camel cases all keys to
    match JavaScript coding convention.
    """

    def __init__(self, mapping=None):
        self.__dict__['_storage'] = {}
        if mapping:
            for k, v in mapping.items():
                self[k] = v

    def __getattr__(self, name):
        return self[name]

    def __setattr__(self, name, value):
        self[name] = value
        
    def __getitem__(self, name):
        return self._storage[to_camelcase(name)]

    def __setitem__(self, name, value):
        self._storage[to_camelcase(name)] = value

    def __delitem__(self, name):
        del self._storage[to_camelcase(name)]

    def __contains__(self, name):
        return to_camelcase(name) in self._storage

    def __iter__(self):
        return iter(self._storage)

    def __len__(self):
        return len(self._storage)

    def __str__(self):
        return '<%s %s>' % (
            self.__class__.__name__,
            self._storage
        )

    __unicode__ = __str__
    __repr__ = __str__


@register_adapter(PropsContainer)
def _encode_PropsContainer(container):
    return container._storage
