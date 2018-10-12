************
  Settings
************

.. contents:: Table of Contents


``get_settings()``
==================

Use ``get_settings()`` function to get the collection of settings for the
current active application::

    >>> from rex.core import Rex, get_settings
    >>> demo = Rex('rex.core_demo', debug=True, demo_folder='./demo')
    >>> with demo:
    ...     settings = get_settings()

    >>> settings
    SettingCollection(debug=True, demo_folder='./demo')
    >>> settings.debug
    True
    >>> settings.demo_folder
    './demo'


Constructing setting collection
===============================

Application configuration is collected from keyword arguments of ``Rex`` constructor
as well as from ``settings.yaml`` files from each package.  Setting values passed
through the constructor override values defined in ``settings.yaml`` files::

    >>> from rex.core import SandboxPackage
    >>> sandbox = SandboxPackage('settings')

    >>> sandbox.rewrite('/settings.yaml', """debug: true""")
    >>> with Rex(sandbox):
    ...     print(get_settings().debug)
    True
    >>> with Rex(sandbox, debug=False):
    ...     print(get_settings().debug)
    False

    >>> sandbox.rewrite('/settings.yaml', """ """)
    >>> with Rex(sandbox):
    ...     print(get_settings())
    SettingCollection(debug=False)

    >>> sandbox.rewrite('/settings.yaml', """***Invalid YAML***""")
    >>> Rex(sandbox)                # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        while scanning an alias
          in "/.../settings.yaml", line 1, column 1
        did not find expected alphabetic or numeric character
          in "/.../settings.yaml", line 1, column 2
    While initializing RexDB application:
        SandboxPackage('settings')

    >>> sandbox.rewrite('/settings.yaml', """Ill-formed settings file""")
    >>> Rex(sandbox)                # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping
    Got:
        Ill-formed settings file
    While parsing:
        "/.../settings.yaml", line 1
    While initializing RexDB application:
        SandboxPackage('settings')

    >>> sandbox.rewrite('/settings.yaml', """unknown: true""")
    >>> Rex(sandbox)                # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unknown setting:
        unknown
    In
        /.../settings.yaml
    While initializing RexDB application:
        SandboxPackage('settings')


Defining settings
=================

To declare a new setting, define a subclass of ``Setting`` and specify
attributes ``name``, ``validate`` and ``default``::

    >>> from rex.core import Setting, IntVal, StrVal

    >>> class OptionalSetting(Setting):
    ...     "A setting with a default value."""
    ...     name = 'optional'
    ...     default = None

    >>> class MandatorySetting(Setting):
    ...     "A setting that must always be specified."""
    ...     name = 'mandatory'

    >>> class IntegerSetting(Setting):
    ...     """A setting that expects an integer value."""
    ...     name = 'integer'
    ...     validate = IntVal()
    ...     default = 0

    >>> class SecretSetting(Setting):
    ...     """A setting with a generated default value."""
    ...     name = 'secret'
    ...     default = lambda self: 'random-value'

    >>> with Rex('-', optional=False, mandatory=True, integer='10', secret='123'):
    ...     print(get_settings())
    SettingCollection(debug=False, integer=10, mandatory=True, optional=False, secret='123')
    >>> with Rex('-', mandatory=True):
    ...     print(get_settings())
    SettingCollection(debug=False, integer=0, mandatory=True, optional=None, secret='random-value')
    >>> Rex('-')
    Traceback (most recent call last):
      ...
    rex.core.Error: Missing mandatory setting:
        mandatory
    While initializing RexDB application:
        -
    >>> Rex('-', mandatory=True, integer='NaN')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        'NaN'
    While validating setting:
        integer
    While initializing RexDB application:
        -
    With parameters:
        integer: 'NaN'
        mandatory: True

Class docstring becomes the setting description::

    >>> IntegerSetting.help()
    'A setting that expects an integer value.'

All settings must be documented::

    >>> class UndocumentedSetting(Setting):
    ...     name = 'undocumented'
    Traceback (most recent call last):
      ...
    AssertionError: undocumented setting: undocumented



