"""

    rex.widget
    ==========

    This package provides a widget toolkit for the RexDB platform.

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

from .parse import WidgetVal
from .library import LabelWidget, HeaderWidget, SectionWidget
from .widget import Widget, NullWidget, GroupWidget
from .state import (
    EntityVal, CollectionVal, PaginatedCollectionVal,
    StateVal, State)
from .jsval import JSVal

# XXX: Consult Kyrylo where logging configuration should reside.
import logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(levelname)s %(name)s %(message)s')
