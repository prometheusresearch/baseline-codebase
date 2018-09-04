***********
  Caching
***********

.. contents:: Table of Contents


``cached``
==========

``rex.core.cached(fn)`` is a function decorator.  For a fixed set of
parameters, ``cached()`` calls the wrapped function only on first invocation
and saves the result.  On subsequent invocations, ``cached()`` returns the
saved result::

    >>> from rex.core import cached

    >>> COUNT = 0

    >>> @cached
    ... def factorial(n):
    ...     global COUNT
    ...     COUNT += 1
    ...     if n <= 0:
    ...         raise ValueError(n)
    ...     if n == 1:
    ...         return 1
    ...     else:
    ...         return n*factorial(n-1)

A cached function must be called in context of an active application::

    >>> from rex.core import Rex
    >>> demo = Rex()

    >>> demo.on()
    >>> factorial(10)
    3628800
    >>> COUNT
    10
    >>> factorial(10)
    3628800
    >>> COUNT
    10
    >>> factorial(12)
    479001600
    >>> COUNT
    12
    >>> demo.off()

Exceptions are not cached::

    >>> demo.on()
    >>> factorial(0)
    Traceback (most recent call last):
      ...
    ValueError: 0
    >>> COUNT
    13
    >>> factorial(0)
    Traceback (most recent call last):
      ...
    ValueError: 0
    >>> COUNT
    14
    >>> demo.off()

Caching is specific to the active application::

    >>> with Rex():
    ...     print(factorial(10))
    3628800
    >>> COUNT
    24

It is an error to call a cached function when no application is active::

    >>> factorial(10)
    Traceback (most recent call last):
      ...
    AssertionError: no active RexDB application


``cached`` with expiration
==========================

You can set an expiration period for a cached value::

    >>> COUNT = 0

    >>> @cached(expires=1)
    ... def product(*xs):
    ...     global COUNT
    ...     COUNT += 1
    ...     p = 1
    ...     for x in xs:
    ...         p *= x
    ...     return p

It works the same way as the regular cached function until the value expires::

    >>> demo.on()
    >>> product(1, 2, 3)
    6
    >>> product(1, 2, 3)
    6
    >>> product(1, 2, 3)
    6
    >>> COUNT
    1

    >>> import time
    >>> time.sleep(1)

    >>> product(1, 2, 3)
    6
    >>> COUNT
    2
    >>> demo.off()


``autoreload``
==============

``@rex.core.autoreload`` is a decorator for functions that load data from
files.  Just like ``@cached``, it saves the result from the function, but it
also re-evaluates the function if any of the source files changes.

The decorated function must have a parameter called ``open`` with default
value ``open``::

    >>> from rex.core import autoreload

    >>> COUNT = 0

    >>> @autoreload
    ... def load(path, open=open):
    ...     global COUNT
    ...     COUNT += 1
    ...     return open(path).read()

The function must be called in the context of a Rex application::

    >>> from rex.core import Rex, SandboxPackage

    >>> sandbox = SandboxPackage()
    >>> demo = Rex(sandbox)
    >>> demo.on()

    >>> sandbox.rewrite('load.txt', """Load me!""")
    >>> load(sandbox.abspath('load.txt'))
    'Load me!'
    >>> COUNT
    1

The second time the function is called, the cached result is returned::

    >>> load(sandbox.abspath('load.txt'))
    'Load me!'
    >>> COUNT
    1

However if we change the file, the function gets called again::

    >>> sandbox.rewrite('load.txt', """Load me, please!""")
    >>> load(sandbox.abspath('load.txt'))
    'Load me, please!'
    >>> COUNT
    2

Any errors when the function is evaluated invalidate the cache::

    >>> sandbox.rewrite('load.txt', None)
    >>> load(sandbox.abspath('load.txt'))       # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    FileNotFoundError: [Errno 2] No such file or directory: '/.../load.txt'

    >>> demo.off()



