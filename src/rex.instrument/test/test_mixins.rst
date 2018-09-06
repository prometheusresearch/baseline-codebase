****************
Interface Mixins
****************


Set up the environment::

    >>> from rex.core import StrVal, IntVal
    >>> from rex.instrument.mixins import *


ImplementationContextable
=========================
blah::

    >>> class SomeInterface(ImplementationContextable):
    ...     @classmethod
    ...     def get_implementation_context(cls, action):
    ...         if action == cls.CONTEXT_ACTION_CREATE:
    ...             return {
    ...                 'foo': {
    ...                     'required': True,
    ...                     'validator': StrVal(),
    ...                 },
    ...                 'bar': {
    ...                     'required': False,
    ...                     'validator': IntVal(),
    ...                 },
    ...             }
    ...         elif action == cls.CONTEXT_ACTION_SAVE:
    ...             return {
    ...                 'foo': {
    ...                     'required': False,
    ...                     'validator': StrVal(),
    ...                 },
    ...             }
    ...         else:
    ...             return {}


    >>> test = {'foo': 'blah'}
    >>> SomeInterface.validate_implementation_context(SomeInterface.CONTEXT_ACTION_CREATE, test)
    {'foo': 'blah'}

    >>> test['bar'] = 123
    >>> SomeInterface.validate_implementation_context(SomeInterface.CONTEXT_ACTION_CREATE, test)
    {'foo': 'blah', 'bar': 123}

    >>> test['baz'] = 'hello'
    >>> SomeInterface.validate_implementation_context(SomeInterface.CONTEXT_ACTION_CREATE, test)
    Traceback (most recent call last):
        ...
    rex.core.Error: Unknown implementation context provided: baz

    >>> del test['baz']
    >>> del test['foo']
    >>> SomeInterface.validate_implementation_context(SomeInterface.CONTEXT_ACTION_CREATE, test)
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing required implementation context "foo"

    >>> test = None
    >>> SomeInterface.validate_implementation_context(SomeInterface.CONTEXT_ACTION_SAVE, test)
    {}

    >>> test = {}
    >>> SomeInterface.validate_implementation_context(SomeInterface.CONTEXT_ACTION_SAVE, test)
    {}

    >>> test = {'foo': 123}
    >>> SomeInterface.validate_implementation_context(SomeInterface.CONTEXT_ACTION_SAVE, test)
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a string
    Got:
        123
    While checking:
        foo

