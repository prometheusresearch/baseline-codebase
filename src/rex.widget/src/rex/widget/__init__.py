"""

    rex.widget
    ==========

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Initialize, get_packages
from rex.web import get_routes

from .validate import WidgetVal
from .widget import (
    Widget, NullWidget, GroupWidget, WidgetComposition, raw_widget)
from .field import Field, computed_field, responder
from .render import render as render_widget, Bootstrap
from .chrome import Chrome

from .transitionable import encode, as_transitionable
from .transitionable import Transitionable, TransitionableRecord

from .column import ColumnVal
from .keypath import KeyPathVal
from .formfield import (
    FormField, FormFieldVal, FormFieldsetVal, EntityFieldsetVal)
from .url import URL, PortURL, QueryURL, URLVal, MutationURL, RequestURL
from .param import ParamVal
from .rst import RSTVal
from .mutation import Mutation
from .port_support import PortSupport

from .util import undefined, MaybeUndefinedVal, JSValue

import rex.widget.library
import rex.widget.map
import rex.widget.menu
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

from .browser_detect import *

class InitializeRexWidget(Initialize):

    def __call__(self):
        for package in get_packages():
            routes = get_routes(package)
            for route in routes:
                handler = routes[route]
                if isinstance(handler, rex.widget.map.WidgetRenderer):
                    handler.validate()
