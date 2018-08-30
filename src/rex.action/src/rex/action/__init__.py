"""

    rex.action
    ==========

    :copyright: 2015, Prometheus Research, LLC

"""



from rex.widget import Field
from rex.core import Initialize, get_packages
from rex.web import get_routes

from .action import Action
from .actions import View, Make, Page, Pick, Edit
from .validate import RexDBVal, ActionVal, override
from .mount import MountedActionVal
from .wizard import Wizard
from .doc import DocumentPlainWidget
from .menu import ActionRenderer
from . import setting

import rex.action.menu

class InitializeRexAction(Initialize):

    def __call__(self):
        for package in get_packages():
            routes = get_routes(package)
            for route in routes:
                handler = routes[route]
                if isinstance(handler, ActionRenderer):
                    handler.validate()
