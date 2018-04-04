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
from .mount import MountedAction, MountedActionVal

__all__ = ('ActionMenu',)


class ActionMenu(Menu):

    key = 'action'
    validate = MountedActionVal()

    def __init__(self, path, access, value):
        super(ActionMenu, self).__init__(path, access, value)
        self.renderer = None

    def render(self, req):
        if not isinstance(self.value, MountedAction):
            self.value = self.value()
        if self.renderer == None:
            self.renderer = ActionRenderer(self.masks(), self.value, self.access, None)
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
