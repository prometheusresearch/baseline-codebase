#
# Copyright (c) 2015, Prometheus Research, LLC
#


import logging
import logging.config

from raven.handlers.logging import SentryHandler

from rex.core import Initialize, get_sentry

from .core import get_logging_config


__all__ = (
    'LoggingInitialize',
)


class LoggingInitialize(Initialize):
    @classmethod
    def signature(cls):  # pragma: no cover
        return 'logging'

    def __call__(self):
        # Just in case we're reinitializing an app within a single Python
        # process, let's force the logging framework to ditch its cached
        # loggers.
        logging.Logger.manager.loggerDict = {}

        # Install our configuration.
        logging.config.dictConfig(get_logging_config())

        # Inject the Sentry handler into the root.
        handler = SentryHandler(
            client=get_sentry(),
            level='ERROR',
        )
        root_logger = logging.getLogger()
        root_logger.addHandler(handler)

        # Capture messages from the warnings module.
        logging.captureWarnings(True)

