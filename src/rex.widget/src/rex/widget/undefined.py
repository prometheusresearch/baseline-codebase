"""

    rex.widget.undefined
    ====================

    :copyright: 2014, Prometheus Research, LLC

"""


from rex.core import Validate, AnyVal

from .util import get_validator_for_key


__all__ = ('undefined', 'MaybeUndefinedVal')


class Undefined(object):
    """ An undefined value.

    Used to represent ``undefined`` value in JavaScript.
    """

    __slots__ = ()

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = object.__new__(cls)
        return cls._instance

    def __nonzero__(self):
        return False

    def __repr__(self):
        return 'Undefined()'

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

    def __repr__(self):
        return '%s(%r)' % (self.__class__.__name__, self.validate)

    def __getitem__(self, key):
        return get_validator_for_key(self.validate, key)

    __str__ = __repr__
    __unicode__ = __repr__
