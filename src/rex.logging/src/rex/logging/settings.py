#
# Copyright (c) 2015, Prometheus Research, LLC
#

from rex.core import Setting, MapVal

from .util import merge_dicts


__all__ = (
    'LoggingFormattersSetting',
    'LoggingHandlersSetting',
    'LoggingFiltersSetting',
    'LoggingLoggersSetting',
    'LoggingRootSetting',
)


class MergedDictionaryMixin(object):
    def merge(self, old_value, new_value):  # pylint: disable=no-self-use
        return merge_dicts(old_value, new_value)


class LoggingFormattersSetting(MergedDictionaryMixin, Setting):
    """
    The configuration for the ``formatters`` section of the `Python Logging`_
    configuration.

    .. _`Python Logging`: https://docs.python.org/2/library/logging.config.html#configuration-dictionary-schema
    """

    #:
    name = 'logging_formatters'
    validator = MapVal()
    default = {}


class LoggingFiltersSetting(MergedDictionaryMixin, Setting):
    """
    The configuration for the ``filters`` section of the `Python Logging`_
    configuration.

    .. _`Python Logging`: https://docs.python.org/2/library/logging.config.html#configuration-dictionary-schema
    """

    #:
    name = 'logging_filters'
    validator = MapVal()
    default = {}


class LoggingHandlersSetting(MergedDictionaryMixin, Setting):
    """
    The configuration for the ``handlers`` section of the `Python Logging`_
    configuration.

    .. _`Python Logging`: https://docs.python.org/2/library/logging.config.html#configuration-dictionary-schema
    """

    #:
    name = 'logging_handlers'
    validator = MapVal()
    default = {}


class LoggingLoggersSetting(MergedDictionaryMixin, Setting):
    """
    The configuration for the ``loggers`` section of the `Python Logging`_
    configuration.

    .. _`Python Logging`: https://docs.python.org/2/library/logging.config.html#configuration-dictionary-schema
    """

    #:
    name = 'logging_loggers'
    validator = MapVal()
    default = {}


class LoggingRootSetting(MergedDictionaryMixin, Setting):
    """
    The configuration for the ``root`` section of the `Python Logging`_
    configuration.

    .. _`Python Logging`: https://docs.python.org/2/library/logging.config.html#configuration-dictionary-schema
    """

    #:
    name = 'logging_root'
    validator = MapVal()
    default = {}

