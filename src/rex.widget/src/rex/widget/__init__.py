"""

    rex.widget
    ==========

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Initialize, get_packages
from rex.web import get_routes

from .validate import WidgetVal
from .widget import (
    Widget, NullWidget, GroupWidget, WidgetComposition)
from .field import Field, computed_field, responder
from .render import render as render_widget

from .transitionable import encode, as_transitionable
from .transitionable import Transitionable, TransitionableRecord

from .dataspec import EntitySpecVal, CollectionSpecVal
from .column import ColumnVal
from .keypath import KeyPathVal
from .formfield import (
    FormField, FormFieldVal, FormFieldsetVal, EntityFieldsetVal)
from .url import URL, PortURL, QueryURL, URLVal
from .param import ParamVal
from .rst import RSTVal

from .util import undefined, MaybeUndefinedVal

import rex.widget.library
import rex.widget.map
import rex.widget.commands
import rex.widget.setting

from .formfield import (
    StringFormField,
    BoolFormField,
    DateFormField,
    FileFormField,
    EnumFormField,
    EntityFormField,
    CalculatedFormField,
    CompositeFormField,
    Fieldset,
    List)

class InitializeRexWidget(Initialize):

    def __call__(self):
        for package in get_packages():
            routes = get_routes(package)
            for route in routes:
                handler = routes[route]
                if isinstance(handler, rex.widget.map.WidgetRenderer):
                    handler.validate()
