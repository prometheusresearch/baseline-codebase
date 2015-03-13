"""

    rex.widget.local
    ================

    Thread-local context.

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple
from contextlib import contextmanager
from thread import get_ident

__all__ = ('context', 'get_request')


# Storage from thread ident to thread local context
_storage = {}


Context = namedtuple('Context', ['request'])

@contextmanager
def context(request):
    """ Context manager for thread local request context."""
    key = get_ident()
    assert key not in _storage
    _storage[key] = Context(request)
    yield
    _storage.pop(key)
    

def get_request():
    """ Return a thread local request which is currently in context."""
    key = get_ident()
    assert key in _storage
    return _storage[key].request
