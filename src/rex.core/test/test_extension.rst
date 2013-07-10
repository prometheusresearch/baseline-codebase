***********************
  Extension machinery
***********************

.. contents:: Table of Contents


``Extension``
=============

We start with creating a RexDB application from the ``__main__`` module, which
allows us to define extensions in-place::

    >>> from rex.core import Rex, Package
    >>> main = Rex('__main__')

To create a new interface, define a subclass of ``Extension``::

    >>> from rex.core import Extension

    >>> class Greet(Extension):
    ...
    ...     @classmethod
    ...     def enabled(cls):
    ...         # Exclude the interface itself from the list of implementations.
    ...         return (cls is not Greet)
    ...
    ...     def __call__(self, name):
    ...         raise NotImplementedError("%s.%s" % (self.__class__.__module__,
    ...                                              self.__class__.__name__))

To create an implementation of the interface, define a subclass of the
interface::

    >>> class Hello(Greet):
    ...
    ...     def __call__(self, name):
    ...         return "Hello, %s!" % name

    >>> class Howdy(Greet):
    ...
    ...     def __call__(self, name):
    ...         return "Howdy, %s!" % name

Now you can find and invoke all implementations of the ``Greet`` interface
available for the current active application::

    >>> with main:
    ...     for greet_type in Greet.all():
    ...         greet = greet_type()
    ...         print greet('Alice')
    Hello, Alice!
    Howdy, Alice!


``Extension.all()``, ``Extension.by_package()``, etc
====================================================

Use method ``Extension.all()`` on the interface to obtain all implementations
of the interface.  For example, to list all settings, use::

    >>> from rex.core import Setting
    >>> demo = Rex('rex.core_demo')

    >>> with demo:
    ...     print Setting.all()
    [rex.core.setting.DebugSetting, rex.core_demo.DemoFolderSetting]

Use method ``Extension.by_package()`` to find all implementations defined
in a specific package::

    >>> with demo:
    ...     print Setting.by_package('rex.core_demo')
    [rex.core_demo.DemoFolderSetting]

You could also pass a ``Package`` object::

    >>> from rex.core import get_packages
    >>> with demo:
    ...     demo_package = get_packages()['rex.core_demo']
    ...     print Setting.by_package(demo_package)
    [rex.core_demo.DemoFolderSetting]

Some interfaces may add additional lookup methods.  For instance, ``Setting``
defines method ``Setting.map_all()``::

    >>> with demo:
    ...     setting_map = Setting.map_all()
    >>> setting_map['debug']
    rex.core.setting.DebugSetting
    >>> setting_map['demo_folder']
    rex.core_demo.DemoFolderSetting


``Extension.top()``
===================

Use method ``Extension.top()`` to get a most specific implementation for
the given interface.  The most specific implementation must be a subclass
of all the other implementations of the same interface.

Currently, ``Greet`` interface has no top implementation::

    >>> with main:
    ...     greet_type = Greet.top()
    Traceback (most recent call last):
      ...
    AssertionError: too many implementations found: __main__.Hello, __main__.Howdy

However, if we define an implementation ``Hi`` so that it is a subclass of
both ``Hello`` and ``Howdy``, it becomes the top implementation::

    >>> class Hi(Hello, Howdy):
    ...
    ...     def __call__(self, name):
    ...         return "Hi, %s!" % name

    >>> main.cache.clear()  # reset `Greet.all()`
    >>> with main:
    ...     greet_type = Greet.top()
    >>> greet = greet_type()
    >>> greet('Alice')
    'Hi, Alice!'


