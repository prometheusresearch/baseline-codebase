***********************
  Extension machinery
***********************

.. contents:: Table of Contents


``Extension``
=============

We start with creating a RexDB application with a sandbox package, which allows
us to define extensions in-place::

    >>> from rex.core import Rex, Package
    >>> main = Rex('-')

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
    ...         print(greet('Alice'))
    Hello, Alice!
    Howdy, Alice!

Each extension has attribute ``package``, which contains the package where
the extension was defined::

    >>> with main:
    ...     package = Hello.package()
    >>> package
    SandboxPackage()


``Extension.all()``
===================

Use method ``Extension.all()`` on the interface to obtain all implementations
of the interface.  For example, to list all settings, use::

    >>> from rex.core import Setting
    >>> demo = Rex('rex.core_demo')

    >>> with demo:
    ...     print(Setting.all())
    [rex.core.setting.DebugSetting, rex.core_demo.DemoFolderSetting]

You can also use ``Extension.all()`` to find all implementations defined
in a specific package::

    >>> with demo:
    ...     print(Setting.all('rex.core_demo'))
    [rex.core_demo.DemoFolderSetting]

You could also pass a ``Package`` object::

    >>> from rex.core import get_packages
    >>> with demo:
    ...     demo_package = get_packages()['rex.core_demo']
    ...     print(Setting.all(demo_package))
    [rex.core_demo.DemoFolderSetting]

One can override the ``Extension.all()`` method to generate extensions on the
fly::

    >>> class GreetTemplates(Greet):
    ... 
    ...     template = None
    ...     templates = ["Hey, {}!", "Aloha!"]
    ... 
    ...     @classmethod
    ...     def enabled(cls):
    ...         return cls.template is not None
    ... 
    ...     @classmethod
    ...     def all(cls, package=None):
    ...         if cls.template is not None:
    ...             return
    ...         for template in cls.templates:
    ...             name = template.title().translate({ord(key): None for key in ' ,{}!'})
    ...             yield type(name, (cls,), {'__module__': __name__, 'template': template})
    ... 
    ...     def __call__(self, name):
    ...         return self.template.format(name)

``GreetTemplates.all()`` generates implementations for each entry in
``GreetTemplates.templates``::

    >>> main.reset()
    >>> with main:
    ...     print(Greet.all())
    [__main__.Hello, __main__.Howdy, __main__.Hey, __main__.Aloha]

Now let us disable the extension::

    >>> GreetTemplates.templates = []
    >>> main.reset()

Some interfaces may add additional lookup methods.  For instance, ``Setting``
defines method ``Setting.mapped()``::

    >>> with demo:
    ...     setting_map = Setting.mapped()
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

    >>> main.reset()    # reset `Greet.all()`
    >>> with main:
    ...     greet_type = Greet.top()
    >>> greet = greet_type()
    >>> greet('Alice')
    'Hi, Alice!'

The set of available implementations is defined correctly even when you use
diamond inheritance::

    >>> with main:
    ...     print(Greet.all())
    [__main__.Hello, __main__.Howdy, __main__.Hi]

    >>> main.reset()


``Extension.disable()``
=======================

Sometimes it is necessary to disable an implementation without changing its
source code.  You can do it using class method ``Extension.disable()``.

For example, let us disable the ``Howdy`` and ``Hi`` implementations of the
``Greet`` interface::

    >>> Greet.disable(Howdy)

    >>> Hi.disable()

    >>> with main:
    ...     print(Greet.all())
    [__main__.Hello]

    >>> Greet.disable_reset()
    >>> Hi.disable_reset()
    >>> main.reset()

You can also disable an extension by name, or even by its signature::

    >>> Setting.disable('DebugSetting', module='rex.core_demo')
    >>> Setting.disable('demo_folder', module='rex.core_demo')

    >>> demo.reset()
    >>> with demo:
    ...     print(Setting.all())
    []

Since the settings are disabled by ``rex.core_demo`` package, it does not
affect the applications that do not include ``rex.core_demo``::

    >>> with main:
    ...     print(Setting.all())
    [rex.core.setting.DebugSetting]

    >>> Setting.disable_reset(module='rex.core_demo')
    >>> demo.reset()


``Extension.ordered()``
=======================

You can use method ``Extension.ordered()`` to get in their priority order.
However to use it, extensions must declare their priorities using attributes
``after`` and ``before``::

    >>> with main:
    ...     print(Greet.ordered())
    Traceback (most recent call last):
      ...
    AssertionError: order is not total: [__main__.Hello, __main__.Howdy]

    >>> Hi.after = [Howdy]
    >>> Hi.before = [Hello]

    >>> with main:
    ...     print(Greet.ordered())
    [__main__.Howdy, __main__.Hi, __main__.Hello]

Priority loops are detected::

    >>> Howdy.after = [Hello]
    >>> main.reset()

    >>> with main:
    ...     print(Greet.ordered())
    Traceback (most recent call last):
      ...
    AssertionError: order has cycles: [__main__.Hello, __main__.Hi, __main__.Howdy, __main__.Hello]

Another way to declare priority order is to use ``Extension.precedence``
method::

    >>> Hi.after = Hi.before = Howdy.after = []
    >>> Greet.precedence([Howdy, Hi, Hello])
    >>> main.reset()

    >>> with main:
    ...     print(Greet.ordered())
    [__main__.Howdy, __main__.Hi, __main__.Hello]

    >>> Greet.precedence_reset()
    >>> main.reset()

You can achieve the same effect using ``Extension.priority`` attribute::

    >>> Howdy.priority = 10
    >>> Hi.priority = 20
    >>> Hello.priority = 30

    >>> with main:
    ...     print(Greet.ordered())
    [__main__.Howdy, __main__.Hi, __main__.Hello]

Alternatively, you could use ``priority`` attribute as the extension
signature that could be used with ``after`` and ``before``::

    >>> Howdy.priority = 'howdy'
    >>> Hello.priority = 'hello'
    >>> Hi.after = 'howdy'
    >>> Hi.before = 'hello'
    >>> main.reset()

    >>> with main:
    ...     print(Greet.ordered())
    [__main__.Howdy, __main__.Hi, __main__.Hello]

When priorities are string values, they could be used in
``Extension.precedence`` calls::

    >>> Hi.after = Hi.before = None
    >>> Hi.priority = 'hi'
    >>> main.reset()
    >>> Greet.precedence(['hi', 'howdy', 'hello'])

    >>> with main:
    ...     print(Greet.ordered())
    [__main__.Hi, __main__.Howdy, __main__.Hello]


``Extension.document_all``
==========================

We use the method ``Extension.document_all`` to get a list of documentation
entries for every implementation of the extension.  For example::

    >>> with main:
    ...     entries = Setting.document_all()

    >>> entries                 # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    [DocEntry('debug', 'Turn on the debug mode.', index='debug', package='rex.core',
              filename='/.../rex/core/setting.py', line=...)]



