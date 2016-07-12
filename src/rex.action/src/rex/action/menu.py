"""

    rex.action.menu
    ===============

    This module contains code with provides handler for rex.menu package.

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.menu import Menu
from rex.web import PathMask

from .map import ActionRenderer
from .action import ActionVal


class ActionMenu(Menu):

    key = 'action'
    validate = ActionVal(id='')

    def __init__(self, path, access, value):
        super(ActionMenu, self).__init__(path, access, value)
        self.render = ActionRenderer(
                self.masks(), self.value, self.access, None)

    def masks(self):
        sanitized_path = self.path
        if sanitized_path.endswith('/'):
            sanitized_path = sanitized_path[:-1]
        return [
            PathMask(self.path),
            PathMask('%s/@@/{path:*}' % sanitized_path),
            PathMask('%s/@/{action:*}' % sanitized_path),
        ]
