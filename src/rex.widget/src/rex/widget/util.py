"""

    rex.widget.util
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

import re
from collections import MutableMapping, OrderedDict

from rex.core import Validate, AnyVal

from .transitionable import Transitionable, as_transitionable


__all__ = ('undefined', 'MaybeUndefinedVal', 'PropsContainer')


class Undefined(Transitionable):
    """ An undefined value.

    Used to represent ``undefined`` value in JavaScript.
    """

    __slots__ = ()
    __transit_tag__ = 'undefined'

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = object.__new__(cls)
        return cls._instance

    def __nonzero__(self):
        return False

    def __repr__(self):
        return 'undefined'

    def __transit_format__(self, req, path):
        return []

    __str__ = __repr__
    __unicode__ = __repr__


undefined = Undefined()


class MaybeUndefinedVal(Validate):

    def __init__(self, validate=AnyVal()):
        self.validate = validate

    def __call__(self, value):
        if value is undefined:
            return value
        return self.validate(value)

    def construct(self, loader, node):
        return self.validate.construct(loader, node)

    def __repr__(self):
        return '%s(%r)' % (self.__class__.__name__, self.validate)

    __str__ = __repr__
    __unicode__ = __repr__


class PropsContainer(MutableMapping):
    """ Widget description props container.

    This is thin wrapper for dict which automatically camel cases all keys to
    match JavaScript coding convention.
    """

    def __init__(self, mapping=None):
        self.__dict__['_storage'] = OrderedDict()
        if mapping:
            for k, v in mapping.items():
                self[k] = v

    def __getattr__(self, name):
        return self[name]

    def __setattr__(self, name, value):
        self[name] = value

    def __delattr__(self, name):
        del self[name]

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
        storage = ', '.join('%r: %r' % (k, v)
                            for k, v in sorted(self._storage.items()))
        return '<%s {%s}>' % (self.__class__.__name__, storage)

    __unicode__ = __str__
    __repr__ = __str__


_to_camelcase_re = re.compile(r'_([a-zA-Z])')


def to_camelcase(value):
    """ Return camelCased version of ``value``."""
    return _to_camelcase_re.sub(lambda m: m.group(1).upper(), value)


@as_transitionable(PropsContainer, tag='map')
def _format_PropsContainer(value, req, path): # pylint: disable=invalid-name
    return value._storage
