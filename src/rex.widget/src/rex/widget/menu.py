"""

    rex.widget.menu
    ===============

    This module contains code with provides handler for rex.menu package.

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.menu import Menu
from rex.web import PathMask

from .validate import WidgetVal
from .map import WidgetRenderer


class WidgetMenu(Menu):

    key = 'widget'
    validate = WidgetVal()

    def __init__(self, path, access, value):
        super(WidgetMenu, self).__init__(path, access, value)
        self.render = WidgetRenderer(
                self.masks(), lambda: self.value, self.access)

    def masks(self):
        if self.path.endswith('/'):
            sub_path = '%s@@/{path:*}' % self.path
        else:
            sub_path = '%s/@@/{path:*}' % self.path
        return [
            PathMask(self.path),
            PathMask(sub_path),
        ]
