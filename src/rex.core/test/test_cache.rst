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
    >>> factorial(20)
    2432902008176640000
    >>> COUNT
    20
    >>> demo.off()

Exceptions are not cached::

    >>> demo.on()
    >>> factorial(0)
    Traceback (most recent call last):
      ...
    ValueError: 0
    >>> COUNT
    21
    >>> factorial(0)
    Traceback (most recent call last):
      ...
    ValueError: 0
    >>> COUNT
    22
    >>> demo.off()

Caching is specific to the active application::

    >>> with Rex():
    ...     print factorial(10)
    3628800
    >>> COUNT
    32

It is an error to call a cached function when no application is active::

    >>> factorial(10)
    Traceback (most recent call last):
      ...
    AssertionError: no active Rex application


