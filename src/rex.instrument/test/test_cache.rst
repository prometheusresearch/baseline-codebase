*******
Caching
*******


Set up the environment::

    >>> from rex.instrument.cache import *


In a simple use case, the cache is just some place you can put a value::

    >>> with InterfaceCache() as cache:
    ...     cache.set('group1', 'key1', 123)
    ...     cache.has('group1', 'key1')
    ...     cache.get('group1', 'key1')
    True
    123

When separate, non-embedded/non-recursive cache is instantiated, the previous
values won't be there::

    >>> with InterfaceCache() as cache:
    ...     cache.has('group1', 'key1')
    ...     cache.get('group1', 'key1') is None
    False
    True


When used in an embedded/recursive manner, each level of the stack can access
the values stored by any other level::

    >>> with InterfaceCache() as cache:
    ...     cache.set('group1', 'key1', 123)
    ...     with InterfaceCache() as cache2:
    ...         cache2.has('group1', 'key1')
    ...         cache2.get('group1', 'key1')
    ...     cache.has('group1', 'key1')
    ...     cache.get('group1', 'key1')
    True
    123
    True
    123

    >>> with InterfaceCache() as cache:
    ...     cache.has('group1', 'key1')
    ...     cache.get('group1', 'key1') is None
    ...     with InterfaceCache() as cache2:
    ...         cache2.set('group1', 'key1', 123)
    ...     cache.has('group1', 'key1')
    ...     cache.get('group1', 'key1')
    False
    True
    True
    123

    >>> with InterfaceCache() as cache:
    ...     cache.set('group1', 'key1', 123)
    ...     with InterfaceCache() as cache2:
    ...         cache2.has('group1', 'key1')
    ...         cache2.get('group1', 'key1')
    ...         cache2.set('group1', 'key2', 456)
    ...         with InterfaceCache() as cache3:
    ...             cache3.has('group1', 'key1')
    ...             cache3.get('group1', 'key1')
    ...             cache3.has('group1', 'key2')
    ...             cache3.get('group1', 'key2')
    ...             cache3.set('group2', 'key3', 'foo')
    ...         cache2.has('group2', 'key3')
    ...         cache2.get('group2', 'key3')
    ...     cache.has('group1', 'key1')
    ...     cache.get('group1', 'key1')
    ...     cache.has('group1', 'key2')
    ...     cache.get('group1', 'key2')
    ...     cache.has('group2', 'key3')
    ...     cache.get('group2', 'key3')
    True
    123
    True
    123
    True
    456
    True
    'foo'
    True
    123
    True
    456
    True
    'foo'


For convenience, there's also a function decorator, ``interface_cache`` that
will enable the context around the execution of the entire function::

    >>> @interface_cache
    ... def my_func(arg1):
    ...     with InterfaceCache() as cache:
    ...         cache.set('group1', 'key1', arg1)
    ...     with InterfaceCache() as cache:
    ...         print(cache.has('group1', 'key1'))
    ...         print(cache.get('group1', 'key1'))
    >>> my_func(15)
    True
    15


There's also a decorator intended for use on a class method that is acting as a
"get" method, where the first argument of the method is the unique ID of the
object being retrieved. This decorator will automatically memoize the value in
the shared cache::

    >>> class Test(object):
    ...     @cached_get('foo')
    ...     def get_thing(self, id):
    ...         return {'foo': id}
    ...     @cached_get('foo')
    ...     def get_nothing(self, id):
    ...         return None
    >>> with InterfaceCache() as scope:
    ...     test = Test()
    ...     scope.has('foo', 'bar')
    ...     test.get_thing('bar')
    ...     scope.has('foo', 'bar')
    ...     scope.get('foo', 'bar')
    ...     scope.set('foo', 'bar', 'a string!')
    ...     test.get_thing('bar')
    False
    {'foo': 'bar'}
    True
    {'foo': 'bar'}
    'a string!'

    >>> with InterfaceCache() as scope:
    ...     test = Test()
    ...     scope.has('foo', 'bar')
    ...     test.get_nothing('bar') is None
    ...     scope.has('foo', 'bar')
    False
    True
    False


