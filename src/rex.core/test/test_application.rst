**********************
  Application object
**********************

.. contents:: Table of Contents


Construction
============

Use ``Rex`` constructor to create an application object::

    >>> from rex.core import Rex

    >>> Rex()
    Rex()

RexDB applications are assembled from packages.  Pass included packages as
positional parameters to the constructor.  A package could be specified by name
or as ``Package`` object::

    >>> Rex('rex.core_demo')
    Rex('rex.core_demo')

    >>> from rex.core import Package

    >>> demo_package = Package('rex.core_demo',
    ...                        modules={'rex.core_demo'},
    ...                        static='./demo/rex.core_demo/static')
    >>> Rex(demo_package)
    Rex(Package('rex.core_demo', modules={'rex.core_demo'}, static='./demo/rex.core_demo/static'))

Pass application settings as keyword parameters to the constructor::

    >>> Rex('rex.core_demo', demo_folder='./demo')
    Rex('rex.core_demo', demo_folder='./demo')

It is an error to specify unknown package name or configuration setting::

    >>> Rex('rex.unknown')
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to satisfy requirement:
        rex.unknown
    While initializing RexDB application:
        rex.unknown

    >>> Rex(unknown=None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unknown setting:
        unknown
    While initializing RexDB application
    With parameters:
        unknown: None


Activation
==========

Use methods ``Rex.on()`` and ``Rex.off()`` to activate and deactivate an
application, and function ``get_rex()`` to return the current active
application::

    >>> from rex.core import get_rex
    >>> demo = Rex('rex.core_demo')
    >>> demo.on()
    >>> get_rex()
    Rex('rex.core_demo')
    >>> demo.off()

Or you could use ``with`` statement on the application object for the same effect::

    >>> with demo:
    ...     print(get_rex())
    Rex('rex.core_demo')

It is an error to call ``get_rex()`` when no application is active::

    >>> get_rex()
    Traceback (most recent call last):
      ...
    AssertionError: no active RexDB application

``get_rex`` could be used to determine if there is an active application::

    >>> print(bool(get_rex))
    False
    >>> with demo:
    ...     print(bool(get_rex))
    True

Activation calls could be nested::

    >>> demo2 = Rex('rex.core_demo')

    >>> demo.on()
    >>> assert get_rex() is demo
    >>> demo2.on()
    >>> assert get_rex() is demo2
    >>> demo2.off()
    >>> assert get_rex() is demo
    >>> demo.off()

    >>> with demo:
    ...     assert get_rex() is demo
    ...     with demo2:
    ...         assert get_rex() is demo2
    ...     assert get_rex() is demo

Calls to ``Rex.on()`` and ``Rex.off()`` methods should be ordered properly::

    >>> demo.on()
    >>> demo2.off()
    Traceback (most recent call last):
      ...
    AssertionError: unexpected RexDB application
    >>> demo.off()


WSGI Interface
==============

Application objects provide WSGI interface, however it is not functional
without ``rex.web`` package::

    >>> from wsgiref.util import setup_testing_defaults
    >>> environ = {}
    >>> setup_testing_defaults(environ)

    >>> def start_response(status, headers, exc_info=None):
    ...     print(status)
    ...     print(headers)

    >>> demo(environ, start_response)
    404 Not Found
    [('Content-Type', 'text/plain')]
    ['Application does not provide web access.\n']



