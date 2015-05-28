#
# Copyright (c) 2015, Prometheus Research, LLC
#


from copy import deepcopy

from rex.core import Setting, MapVal


__all__ = (
    'LoggingFormattersSetting',
    'LoggingHandlersSetting',
    'LoggingFiltersSetting',
    'LoggingLoggersSetting',
    'LoggingRootSetting',
)


class MergedDictionaryMixin(object):
    def merge(self, old_value, new_value):
        merged = deepcopy(old_value)
        for key, value in new_value.items():
            if key not in merged:
                merged[key] = value
            else:
                if isinstance(merged[key], dict) and isinstance(value, dict):
                    merged[key] = self.merge(merged[key], value)
                else:
                    merged[key] = value
        return merged


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

