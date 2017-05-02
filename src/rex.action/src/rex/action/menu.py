"""

    rex.action.menu
    ===============

    This module contains code with provides handler for rex.menu package.

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property
from webob.exc import HTTPUnauthorized, HTTPBadRequest

from rex.core import Error
from rex.menu import Menu
from rex.web import PathMask, confine, authorize
from rex.widget.render import render

from .action import ActionVal, ActionBase
from .wizard import WizardBase
from .widget import ActionWizard


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


class ActionRenderer(object):

    def __init__(self, path, action, access, package):
        self.path = path
        self._action = action
        self.access = access or package.name
        self.package = package

    @cached_property
    def action(self):
        if isinstance(self._action, ActionBase):
            return self._action
        else:
            return self._action()

    def validate(self):
        self.action.typecheck()

    def __call__(self, request):
        if not authorize(request, self.access):
            raise HTTPUnauthorized()
        try:
            # TODO: check for context vars from query params and wrap into
            # ActionRenderer
            action = self.action
            if not isinstance(self.action, WizardBase):
                action = ActionWizard(action=action)
            with confine(request, self):
                own, via_path, _ = self.path
                params = match(own, request.path_info)
                if params is not None:
                    return render(action, request)
                params = match(via_path, request.path_info)
                if params is not None:
                    return render(action, request, path=params['path'])
                raise HTTPBadRequest()

        except Error, error:
            return request.get_response(error)


def match(mask, path):
    try:
        return mask(path)
    except ValueError:
        return None
