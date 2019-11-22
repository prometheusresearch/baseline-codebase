******************************
  REX.CORE Programming Guide
******************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: exc(literal)
.. role:: meth(literal)
.. role:: attr(literal)
.. role:: func(literal)


Overview
========

This package provides the foundation of the RexDB platform:

* initialization;
* extension mechanism;
* configuration management;
* base exception class;
* validation utilities.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Constructing applications
=========================

Use :class:`rex.core.Rex` constructor to create a new RexDB application.  For
example::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.core_demo',
    ...            demo_folder='./demo')

This code creates a RexDB application from :mod:`rex.core_demo` package with a
configuration parameter ``demo_folder`` set to ``'./demo'``.

RexDB applications are assembled from reusable components called *packages*.
Packages that form the application are passed as positional arguments to the
:class:`rex.core.Rex` constructor.  Application parameters are passed as
keyword arguments of the constructor.

Most API calls require you to activate the application first.  Use ``with``
statement on the application object to activate it::

    >>> from rex.core import get_rex

    >>> with demo:
    ...     print((get_rex()))
    Rex('rex.core_demo', demo_folder='./demo')

The application is activated before the ``with`` block is executed and
deactivated after the block is complete.  In this example, function
:func:`rex.core.get_rex()` returns the current active RexDB application, which
gives you the same ``demo`` object.

You can also use methods :meth:`rex.core.Rex.on()` and
:meth:`rex.core.Rex.off()` for the same effect::

    >>> demo.on()
    >>> get_rex()
    Rex('rex.core_demo', demo_folder='./demo')
    >>> demo.off()

It is an error to call an API that expects an active application when no
application is activated::

    >>> get_rex()
    Traceback (most recent call last):
      ...
    AssertionError: no active RexDB application


Application components
======================

In RexDB platform, a *package* is a Python package distribution that may
contain:

* Python code;
* associated static files;
* documentation;
* ``setup.py`` script.

Packages may depend on each other.  If a package is included as a part of a
RexDB application, all its dependencies are also included.  Package
dependencies are determined from ``install_requires`` parameter of ``setup.py``
script.

Use function :func:`rex.core.get_packages()` to get the collection of packages
included with the current active application::

    >>> from rex.core import get_packages

    >>> with demo:
    ...     packages = get_packages()

You can iterate over all the packages or find a package by name::

    >>> for package in packages:
    ...     print((package.name))
    rex.core_demo
    rex.core

    >>> demo_package = packages['rex.core_demo']
    >>> demo_package.name
    'rex.core_demo'

Packages may contain both Python code and static resources.  You can use method
:meth:`rex.core.Package.open()` to open a package resource for reading.  For
example, to read file ``www/index.html`` from :mod:`rex.core_demo` package,
use::

    >>> index_file = demo_package.open('www/index.html')
    >>> index_data = index_file.read()
    >>> index_file.close()

Package collection provides similar API for reading static files, but requires
you to include the package name with the path::

    >>> index_file = packages.open('rex.core_demo:/www/index.html')

RexDB platform supports other types of packages.  You can create a RexDB
package from any Python module or a directory on the file system.  For testing,
it is convenient to use the *sandbox* package created from the ``__main__``
module and a temporary static directory.


Application configuration
=========================

Use function :func:`rex.core.get_settings()` to access configuration of the
current active application::

    >>> from rex.core import get_settings

    >>> with demo:
    ...     settings = get_settings()

    >>> settings.demo_folder
    './demo'

Application configuration is generated from parameters passed to the
:class:`rex.core.Rex` constructor and from predefined setting values provided
by packages.  The set of available settings is determined by the set of
included packages.


Creating a package
==================

To develop a new package, start with the following layout::

    rex.<name>/
        README.rst
        LICENSE.rst
        NEWS.rst
        setup.py
        src/
            rex/
                __init__.py
                <name>/
                    __init__.py
                    [...]
        static/
            www/
                [...]
            settings.yaml
            [...]
        demo/
            rex.<name>_demo/
                [...]
        test/
            [...]
        doc/
            [...]

``README.rst``
    Package description and overview of the public API exported by the package.

``LICENSE.rst``
    Copyright and licensing information.

``NEWS.rst``
    Release notes.

``setup.py``
    This is a standard Distutils setup file.  It should follow the template::

        from setuptools import setup, find_packages

        setup(
            name='rex.<name>',
            version = "<version>",
            description="<description>",
            long_description=open('README', 'r').read(),
            maintainer="Prometheus Research, LLC",
            license="Apache v2",
            url="http://bitbucket.org/prometheus/rex.<name>",
            package_dir={'': 'src'},
            packages=find_packages('src'),
            namespace_packages=['rex'],
            setup_requres=[
                'rex.setup >=1.0, <2'
            ],
            install_requires=[
                <...>
            ],
            rex_init='rex.<name>',
            rex_static='static',
            rex_download={...},
        )

    Use parameter ``install_requires`` to indicate package dependencies.

    To support RexDB extension and distribution mechanisms, we provide three
    additional setup parameters: ``rex_init``, ``rex_static``, and
    ``rex_download``.  To enable these parameters, add a setup dependency on
    ``rex.setup`` package::

        setup_requres=['rex.setup'],

    You don't need this line if you don't need to define any of these
    parameters.

    ``rex_init``
        This parameter refers to the module to be executed when the application
        is initialized.  Use it for packages that define any extensions such as
        settings declarations or HTTP commands.

    ``rex_static``
        This parameter specifies the directory which contains resource files to
        be distributed with the package.  By convention, we name this directory
        ``static``.  Standard distutils commands ``install``, ``develop`` and
        ``sdist`` are extended to support this parameter.  On installation,
        static files are copied to directory ``<base>/share/rex/<package>``.

    ``rex_download``
        This parameter specifies external dependencies to be downloaded when
        the package is installed.  It maps a target directory to a list of URLs
        which should populate the target directory.

``src/rex/__init__.py``
    This file must declare a namespace package::

        __import__('pkg_resources').declare_namespace(__name__)

``src/rex/<name>/__init__.py``
    This file must export all public classes and functions implemented by the
    package.

``static/``
    This directory contains all static files to be distributed with the
    package.

``static/www/``
    This directory contains files accessible via HTTP.

``static/settings.yaml``
    This file provides default values for any configuration parameters.  Use it
    to configure dependent packages.

``demo/``
    Contains demo packages for testing.

``test/``
    Contains regression tests.

``doc/``
    Package documentation.


Declaring settings
==================

To add a new configuration parameter, create a subclass of
:class:`rex.core.Setting` class and assign the parameter name to
:attr:`rex.core.Setting.name` attribute.  For example, this is how
:mod:`rex.core_demo` declares ``demo_folder`` setting::

    from rex.core import Setting, StrVal

    class DemoFolderSetting(Setting):
        """Directory with demo data."""

        name = 'demo_folder'
        default = None
        validate = StrVal()

Setting properties are inferred from the class definition as follows:

*Name*
    Setting name is specified by the :attr:`.Setting.name` attribute.

*Description*
    Setting description is extracted from the class docstring.

*Validation*
    To validate and normalize setting values, override method
    :meth:`.Setting.validate()`.  This method must take a raw setting value,
    check if it is valid, possibly normalize it and return it.  Alternatively,
    you can assign an instance of :class:`rex.core.Validate` to
    :attr:`.Setting.validate` attribute.

*Default value*
    Override method :meth:`.Setting.default()` to return the default value of
    the setting.  Alternatively, you can assign the default value to
    :attr:`.Setting.default` attribute.  Otherwise, you will get an error when
    a setting value is not provided.

In order for the setting declaration to take effect, it must be loaded when the
application is initialized.  Use ``rex_init`` parameter in ``setup.py`` to
indicate which module to load.


Extension mechanism
===================

:class:`rex.core.Setting` is an example of the generic extension mechanism for
RexDB applications.  This extension mechanism allows packages to:

* declare *interfaces* that provide various services;
* define *implementations* for interfaces;
* find implementations for the given interface.

To declare a new interface, create a subclass of :class:`rex.core.Extension`.
For example, :mod:`rex.core_demo` defines the following ``Command`` interface::

    from rex.core import Extension

    class Command(Extension):
        """Interface for named commands."""

        name = None

        @classmethod
        def sanitize(cls):
            assert cls.name is None or isinstance(cls.name, str)

        @classmethod
        def enabled(cls):
            return (cls.name is not None)

        @classmethod
        def signature(cls):
            return cls.name

        def __init__(self):
            pass

        def __call__(self):
            raise NotImplementedError("%s.__call__()"
                                      % self.__class__.__name__)

Here, we created a subclass ``Command`` of :class:`.Extension` with
several methods and attributes:

``name``
    The name of the command.  It is used when we look for a command
    implementation with a specific name.

:meth:`rex.core.Extension.sanitize()`
    This method is called when a new subclass of :class:`Command` is created.
    We use it to check that the command name is well-formed.

:meth:`rex.core.Extension.enabled()`
    This method is used to distinguish complete implementation from abstract
    and mixin classes.  We assume that any subclass with defined ``name``
    attribute must be a complete implementation.

:meth:`rex.core.Extension.signature()`
    This method must return a unique identifier (in this case, the command
    name) of the implementation.  You can use :meth:`.Extension.mapped()` to
    get a dictionary that maps signatures to implementations.  There are other
    methods for finding a specific implementation: :meth:`.Extension.all()`,
    :meth:`.Extension.top()`, :meth:`.Extension.ordered()`.  Use method
    :meth:`.Extension.package()` on the implementation class to find the
    package which owns the implementation.

To declare an implementation, create a subclass of the interface class::

    class HelloCommand(Command):
        """Greets the World!"""

        name = 'hello'

        def __call__(self):
            return "Hello, World!"

To get a list of all implementations defined in the current active application,
use :meth:`rex.core.Extension.all()` method::

    >>> from rex.core_demo import Command

    >>> with demo:
    ...     print((Command.all()))
    [rex.core_demo.HelloCommand]

To find a command by name, use::

    >>> with demo:
    ...    command_map = Command.mapped()
    ...    command_type = command_map['hello']

    >>> command = command_type()
    >>> command()
    'Hello, World!'

Just like with settings, for an interface implementation to take effect, the
module or the package where the implementation is defined must be specified in
``rex_init`` parameter of ``setup.py``.


Error reporting
===============

Use class :exc:`rex.core.Error` or its subclasses for all custom exceptions.
This exception allows you to specify the context trace of the error.

Each entry in the trace consists of the error message and optional error
data.  For example::

    >>> from rex.core import Error

    >>> raise Error("Found no product:", "beer")
    Traceback (most recent call last):
      ...
    rex.core.Error: Found no product:
        beer

To add an entry to the context trace, use :meth:`.Error.wrap()` method::

    >>> product = "beer"
    >>> where = "refrigerator #%s" % 3
    >>> try:
    ...     raise Error("Found no product:", product)
    ... except Error as error:
    ...     error.wrap("While looking in:", where)
    ...     raise
    Traceback (most recent call last):
      ...
    rex.core.Error: Found no product:
        beer
    While looking in:
        refrigerator #3

The same code could we written using :class:`rex.core.guard` context manager::

    >>> from rex.core import guard

    >>> with guard("While looking in:", where):
    ...     raise Error("Found no product:", product)
    Traceback (most recent call last):
      ...
    rex.core.Error: Found no product:
        beer
    While looking in:
        refrigerator #3


Input validation
================

:mod:`rex.core` contains utilities for validating and normalizing input values.
These utilities could be used for validating configuration settings, parsing
HTTP form values and similar tasks.

For example, :class:`rex.core.IntVal` validates integer values::

    >>> from rex.core import IntVal

    >>> int_val = IntVal()
    >>> int_val(3)
    3
    >>> int_val('10')
    10

Note that the integer validator accepts both an integer object and a numeric
string converting the latter to an integer.

When the validator rejects the input value, :class:`rex.core.Error` exception
is raised::

    >>> int_val('NaN')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected an integer
    Got:
        'NaN'

You can also use validators to parse and validate YAML documents::

    >>> int_val.parse("""
    ... ---
    ... -8
    ... """)
    -8

The YAML loader accepts a safe subset of YAML.  It also understand non-standard
tags: ``!include`` and ``!include/str``, which are used to include data from an
external file.  The content of an ``!include`` and ``!include/str`` nodes must
be a relative path to the file containing the data.  Use ``!include`` to
include a YAML document, ``!include/str`` to include a literal string.




