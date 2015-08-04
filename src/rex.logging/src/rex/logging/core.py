#
# Copyright (c) 2015, Prometheus Research, LLC
#


import logging
import types

from rex.core import get_settings


__all__ = (
    'get_logger',
    'get_logging_config',
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

    if isinstance(name, (types.TypeType, types.ClassType, types.FunctionType)):
        # Classes (old- or new-style) or Functions
        name = name.__name__
    elif hasattr(name, '__class__') \
            and ('__dict__' in dir(name) or hasattr(name, '__slots__')):
        # Instances of new-style classes
        name = name.__class__.__name__
    elif isinstance(name, (types.InstanceType,)):
        # Instances of old-style classes
        name = name.__class__.__name__
    elif isinstance(name, types.MethodType):
        # Class methods
        name = '%s.%s' % (
            name.im_class.__name__,
            name.__name__,
        )
    elif name is not None:
        name = str(name)

    return logging.getLogger(name)


def get_logging_config():
    """
    Assembles the configuration for the Python Logging framework using the
    RexDB application Settings defined by this package.

    :returns:
        A configuration that can be used with ``logging.config.dictConfig()``
    :rtype: dict
    """

    return {
        'version': 1,
        'incremental': False,
        'disable_existing_loggers': True,
        'formatters': get_settings().logging_formatters,
        'filters': get_settings().logging_filters,
        'handlers': get_settings().logging_handlers,
        'loggers': get_settings().logging_loggers,
        'root': get_settings().logging_root,
    }
