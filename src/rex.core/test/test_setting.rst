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

    >>> with Rex('./test/data/debug_setting/'):
    ...     print get_settings().debug
    True
    >>> with Rex('./test/data/debug_setting/', debug=False):
    ...     print get_settings().debug
    False
    >>> with Rex('./test/data/empty_setting/'):
    ...     print get_settings()
    SettingCollection(debug=False)
    >>> Rex('./test/data/broken_setting/')          # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Failed to parse settings file:
        found undefined alias 'This'
          in "/.../test/data/broken_setting/settings.yaml", line 1, column 1
    While initializing RexDB application:
        ./test/data/broken_setting/
    >>> Rex('./test/data/ill_formed_setting/')      # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Got ill-formed settings file:
        /.../test/data/ill_formed_setting/settings.yaml
    While initializing RexDB application:
        ./test/data/ill_formed_setting/
    >>> Rex('./test/data/unknown_setting/')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Got unknown setting:
        unknown
    In
        /.../test/data/unknown_setting/settings.yaml
    While initializing RexDB application:
        ./test/data/unknown_setting/


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

    >>> with Rex('__main__', optional=False, mandatory=True, integer='10', secret='123'):
    ...     print get_settings()
    SettingCollection(debug=False, integer=10, mandatory=True, optional=False, secret='123')
    >>> with Rex('__main__', mandatory=True):
    ...     print get_settings()
    SettingCollection(debug=False, integer=0, mandatory=True, optional=None, secret='random-value')
    >>> Rex('__main__')
    Traceback (most recent call last):
      ...
    Error: Missing mandatory setting:
        mandatory
    While initializing RexDB application:
        __main__
    >>> Rex('__main__', mandatory=True, integer='NaN')
    Traceback (most recent call last):
      ...
    Error: Expected an integer
    Got:
        'NaN'
    While validating setting:
        integer
    While initializing RexDB application:
        __main__
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


