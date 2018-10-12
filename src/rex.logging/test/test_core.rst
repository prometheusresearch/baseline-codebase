************
Logging Core
************


get_logger
==========

The ``get_logger()`` function will return a logger for the given name or object::

    >>> from rex.logging import get_logger

    >>> get_logger('foobar').name
    'foobar'

    >>> class Foo(object):
    ...     def blah(self):
    ...         pass
    >>> get_logger(Foo).name
    'Foo'
    >>> foo = Foo()
    >>> get_logger(foo).name
    'Foo'
    >>> get_logger(Foo) == get_logger(foo)
    True
    >>> get_logger(Foo.blah).name
    'Foo.blah'
    >>> get_logger(foo.blah).name
    'Foo.blah'

    >>> class OldStyleFoo():
    ...     def blah(self):
    ...         pass
    >>> get_logger(OldStyleFoo).name
    'OldStyleFoo'
    >>> old_foo = OldStyleFoo()
    >>> get_logger(old_foo).name
    'OldStyleFoo'
    >>> get_logger(OldStyleFoo) == get_logger(old_foo)
    True
    >>> get_logger(OldStyleFoo.blah).name
    'OldStyleFoo.blah'
    >>> get_logger(old_foo.blah).name
    'OldStyleFoo.blah'

    >>> def bar():
    ...     pass
    >>> get_logger(bar).name
    'bar'


get_logging_config
==================

The ``get_logging_config()`` function will return a dictionary that can be used
to initialize the Python Logging framework::

    >>> from rex.logging import get_logging_config
    >>> from rex.core import Rex

    >>> rex = Rex('rex.logging')
    >>> with rex:
    ...     get_logging_config()
    {'version': 1, 'incremental': False, 'disable_existing_loggers': True, 'formatters': {'brief': {'format': '%(message)s'}, 'basic': {'format': '%(levelname)s:%(name)s:%(message)s'}, 'detailed': {'format': '%(asctime)s|%(process)s|%(threadName)s|%(name)s|%(levelname)s|%(message)s'}}, 'filters': {}, 'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'basic', 'stream': 'ext://sys.stdout'}}, 'loggers': {'raven': {'level': 'ERROR'}}, 'root': {'level': 'INFO', 'handlers': ['console']}}

    >>> rex = Rex('rex.logging_demo')
    >>> with rex:
    ...     get_logging_config()
    {'version': 1, 'incremental': False, 'disable_existing_loggers': True, 'formatters': {'brief': {'format': '%(message)s'}, 'basic': {'format': '%(levelname)s:%(name)s:%(message)s'}, 'detailed': {'format': '%(name)s:%(message)s'}}, 'filters': {}, 'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'basic', 'stream': 'ext://sys.stdout'}, 'console_error': {'class': 'logging.StreamHandler', 'formatter': 'detailed', 'stream': 'ext://sys.stderr'}}, 'loggers': {'raven': {'level': 'ERROR'}}, 'root': {'level': 'DEBUG', 'handlers': ['console']}}



disable_logging & enable_logging
================================

These functions allow you to turn on/off the entire logging system::

    >>> import logging
    >>> from rex.logging import disable_logging, enable_logging
    >>> rex = Rex('rex.logging_demo')
    >>> rex.on()
    >>> def say_hello():
    ...     log = get_logger()
    ...     log.debug('Hello')
    ...     log.info('Hello')
    ...     log.warn('Hello')
    ...     log.error('Hello')
    ...     log.critical('Hello')

    >>> say_hello()
    DEBUG:root:Hello
    INFO:root:Hello
    WARNING:root:Hello
    ERROR:root:Hello
    CRITICAL:root:Hello

    >>> disable_logging()
    >>> say_hello()
    ERROR:root:Hello
    CRITICAL:root:Hello

    >>> disable_logging(logging.CRITICAL)
    >>> say_hello()

    >>> enable_logging()
    >>> say_hello()
    DEBUG:root:Hello
    INFO:root:Hello
    WARNING:root:Hello
    ERROR:root:Hello
    CRITICAL:root:Hello

    >>> rex.off()

