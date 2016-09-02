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
            'primary': json.dumps(settings.header_primary_color),
            'secondary': json.dumps(settings.header_secondary_color),
        }
        return '''
        <script>
            function __REACT_UI_THEME__(theme) {
                if (%(primary)s) {
                    theme.brandColors.primary = %(primary)s;
                }
                if (%(secondary)s) {
                    theme.brandColors.secondary = %(secondary)s;
                }
            }
        </script>
        ''' % theme
