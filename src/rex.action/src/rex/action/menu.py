"""

    rex.action.menu
    ===============

    This module contains code with provides handler for rex.menu package.

    :copyright: 2015-recent, Prometheus Research, LLC

"""

from __future__ import absolute_import

from rex.menu import Menu
from rex.web import PathMask

from .render import ActionRenderer
from .mount import MountedActionVal

__all__ = ('ActionMenu',)


class ActionMenu(Menu):

    key = 'action'
    validate = MountedActionVal()

    def __init__(self, path, access, value):
        super(ActionMenu, self).__init__(path, access, value)
        self.renderer = ActionRenderer(self.masks(), self.value, self.access, None)

    def render(self, req):
        return self.renderer(req)

    def masks(self):
        sanitized_path = self.path
        if sanitized_path.endswith('/'):
            sanitized_path = sanitized_path[:-1]
        return [
            PathMask(self.path),
            PathMask('%s/@@/{path:*}' % sanitized_path),
            PathMask('%s/@/{action:*}' % sanitized_path),
        ]
