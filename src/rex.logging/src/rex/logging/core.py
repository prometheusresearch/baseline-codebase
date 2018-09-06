#
# Copyright (c) 2015, Prometheus Research, LLC
#


import logging
import types

from rex.core import get_settings

from .util import merge_dicts


__all__ = (
    'get_logger',
    'get_logging_config',
    'disable_logging',
    'enable_logging',
)


def get_logger(name=None):
    """
    A convenience wrapper around the ``logging.getLogger()`` function. If this
    function receives a class or a function, then this will return a logger for
    the name of that class/function. If this function receives an instance of a
    class, then this will return a logger for the name of the class the
    instance is of.

    :param name: the name of the logger
    :type name: str, class, function, instance
    :rtype: logging.Logger
    """

    if isinstance(name, (type, types.FunctionType, types.MethodType)):
        # Classes or Functions
        name = name.__qualname__
    elif hasattr(name, '__class__') \
            and ('__dict__' in dir(name) or hasattr(name, '__slots__')):
        # Instances of new-style classes
        name = name.__class__.__qualname__
    elif name is not None:
        name = str(name)

    return logging.getLogger(name)


BASE_LOGGERS = {
    'raven': {
        'level': 'ERROR',
    },
}


def get_logging_config():
    """
    Assembles the configuration for the Python Logging framework using the
    RexDB application Settings defined by this package.

    :returns:
        A configuration that can be used with ``logging.config.dictConfig()``
    :rtype: dict
    """

    loggers = merge_dicts(BASE_LOGGERS, get_settings().logging_loggers)

    return {
        'version': 1,
        'incremental': False,
        'disable_existing_loggers': True,
        'formatters': get_settings().logging_formatters,
        'filters': get_settings().logging_filters,
        'handlers': get_settings().logging_handlers,
        'loggers': loggers,
        'root': get_settings().logging_root,
    }


def disable_logging(level=logging.WARNING):
    """
    Shuts down the logging in the application of all messages equal to or lower
    than the specified level.

    :param level:
        the level at which logging should be disabled. if not specified,
        defaults to ``logging.WARNING``.
    :type level: int
    """

    logging.disable(level)


def enable_logging():
    """
    (Re-)Enables logging in the application.
    """

    logging.disable(logging.NOTSET)

