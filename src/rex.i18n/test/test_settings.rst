********
Settings
********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.core import Rex, get_settings


i18n_default_locale
===================

The default value of the ``i18n_default_locale`` setting is ``en``, but it can
be set to any valid POSIX Locale identifier::

    >>> app = Rex('__main__', 'rex.i18n')
    >>> with app:
    ...     get_settings().i18n_default_locale
    Locale('en')

    >>> app = Rex('__main__', 'rex.i18n', i18n_default_locale='fr_CA')
    >>> with app:
    ...     get_settings().i18n_default_locale
    Locale('fr', territory='CA')
    >>> app = Rex('__main__', 'rex.i18n', i18n_default_locale='fr-CA')
    >>> with app:
    ...     get_settings().i18n_default_locale
    Locale('fr', territory='CA')

    >>> app = Rex('__main__', 'rex.i18n', i18n_default_locale='foobar')
    Traceback (most recent call last):
      ...
    rex.core.Error: expected a POSIX or RFC5646 locale identifier, got 'foobar'
    While validating setting:
        i18n_default_locale
    While initializing RexDB application:
        __main__
        rex.i18n
    With parameters:
        i18n_default_locale: 'foobar'


i18n_default_timezone
=====================

The default value of the ``i18n_default_timezone`` setting is ``UTC``, but it
can be set to any valid IANA timezone identifier::

    >>> app = Rex('__main__', 'rex.i18n')
    >>> with app:
    ...     get_settings().i18n_default_timezone.zone
    'UTC'

    >>> app = Rex('__main__', 'rex.i18n', i18n_default_timezone='America/New_York')
    >>> with app:
    ...     get_settings().i18n_default_timezone.zone
    'America/New_York'

    >>> app = Rex('__main__', 'rex.i18n', i18n_default_timezone='foobar')
    Traceback (most recent call last):
      ...
    rex.core.Error: expected an IANA TZ identifier, got 'foobar'
    While validating setting:
        i18n_default_timezone
    While initializing RexDB application:
        __main__
        rex.i18n
    With parameters:
        i18n_default_timezone: 'foobar'


i18n_supported_locales
======================

The default value of the ``i18n_supported_locales`` setting is a list with just
a single locale, ``en``, but it can be set to a lists containing any number of
valid POSIX Locale identifiers::

    >>> app = Rex('__main__', 'rex.i18n')
    >>> with app:
    ...     get_settings().i18n_supported_locales
    [Locale('en')]

    >>> app = Rex('__main__', 'rex.i18n', i18n_supported_locales=['en', 'fr_CA'])
    >>> with app:
    ...     get_settings().i18n_supported_locales
    [Locale('en'), Locale('fr', territory='CA')]
    >>> app = Rex('__main__', 'rex.i18n', i18n_supported_locales=['en', 'fr-CA'])
    >>> with app:
    ...     get_settings().i18n_supported_locales
    [Locale('en'), Locale('fr', territory='CA')]

    >>> app = Rex('__main__', 'rex.i18n', i18n_supported_locales=['fr_CA', 'ar'])
    >>> with app:
    ...     get_settings().i18n_supported_locales
    [Locale('fr', territory='CA'), Locale('ar')]

    >>> app = Rex('__main__', 'rex.i18n', i18n_supported_locales=['foobar'])
    Traceback (most recent call last):
      ...
    rex.core.Error: expected a POSIX or RFC5646 locale identifier, got 'foobar'
    While validating sequence item
        #1
    While validating setting:
        i18n_supported_locales
    While initializing RexDB application:
        __main__
        rex.i18n
    With parameters:
        i18n_supported_locales: ['foobar']

