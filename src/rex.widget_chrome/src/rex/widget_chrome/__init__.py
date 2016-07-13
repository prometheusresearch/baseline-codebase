#
# Copyright (c) 2014, Prometheus Research, LLC
#

import json

from rex.core import get_settings
from rex.widget import Bootstrap

from .setting import *
from .middleware import *
from .access import *
#from .error import *
from .chrome import Chrome
from .menu import Chrome as MenuChrome

class ChromeThemeBootstrap(Bootstrap):

    name = 'chrome_theme'

    def __call__(self, req):
        settings = get_settings()
        theme = {
            'header_primary_color': settings.header_primary_color,
            'header_secondary_color': settings.header_secondary_color,
        }
        return '<script>var __REX_WIDGET_CHROME_THEME__ = %s;</script>' % \
               json.dumps(theme)
