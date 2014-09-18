"""

    rex.widget
    ==========

    This package provides a widget toolkit for the RexDB platform.

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

from rex.core import Validate, Setting
from .parse import WidgetVal
from .library import Page
from .widget import Widget, NullWidget, GroupWidget, Field, StateField
from .fields import (
    Field, StateField, CollectionField,
    PaginatedCollectionField, EntityField)
from .state import Reference, State, Dep, unknown
from .jsval import JSVal
from .urlmap import WidgetRenderer


class Logging(Setting):
    """ Parameter specifies logging configuration."""

    name = 'logging'

    def __call__(self, config):
        if config:
            config = dict(*config)
            import logging.config
            logging.config.dictConfig(config)
