#
# Copyright (c) 2015, Prometheus Research, LLC
#


import logging
import logging.config

from rex.core import Initialize

from .core import get_logging_config


__all__ = (
    'LoggingInitialize',
)


class LoggingInitialize(Initialize):
    def __call__(self):
        logging.config.dictConfig(get_logging_config())

        # Just in case we're reinitializing an app within a single Python
        # process, let's force the logging framework to ditch its cached
        # loggers.
        logging.Logger.manager.loggerDict = {}

