"""

    rex.widget
    ==========

    This package provides a widget toolkit for the RexDB platform.

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

from rex.core import Validate, Setting
from .parse import WidgetVal
from .library import LabelWidget, HeaderWidget, SectionWidget
from .widget import Widget, NullWidget, GroupWidget, Field, StateField
from .state import (
    EntityVal, CollectionVal, PaginatedCollectionVal,
    PaginatedCollectionComputator, CollectionComputator, EntityComputator,
    StateVal, State, Dep, unknown)
from .jsval import JSVal

class LoggingVal(Validate):

    def __call__(self, data):
        if data is not None:
            import logging
            logging.dictCondig(data)


class Logging(Setting):
    """ Parameter specifies logging configuration."""

    name = 'logging'
    validator = LoggingVal
    default = None
