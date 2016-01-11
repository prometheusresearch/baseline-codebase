#
# Copyright (c) 2014, Prometheus Research, LLC
#

from .setting import *
from .middleware import *
from .simple import *
#from .error import *

from rex.core import Initialize, get_settings
from rex.web import route, Authorize
from rex.action.map import ActionRenderer
from rex.widget.map import WidgetRenderer


class InitializeMenu(Initialize):

    def __call__(self):
        menu = get_settings().menu
        access_map = Authorize.mapped()
        for level1 in menu:
            for item in level1.items:
                handler = route(item.url)
                assert handler is not None, \
                       ('Cannot find handler for the URL: %s. '
                        'Check your "menu" setting.') % item.url
                assert isinstance(handler, (ActionRenderer, WidgetRenderer)), \
                       ('Wrong handler for the URL: %s. '
                        'Check your "menu" setting.') % item.url
                access = access_map.get(item.access)
                assert access is not None, \
                       ('Permission "%s" for the URL: %s cannot be found. '
                        'Check your "menu" setting.') % (item.access, item.url)
