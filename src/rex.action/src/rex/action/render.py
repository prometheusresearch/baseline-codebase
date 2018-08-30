"""

    rex.action.render
    =================

    :copyright: 2015-recent, Prometheus Research, LLC

"""



from cached_property import cached_property
from webob.exc import HTTPUnauthorized, HTTPBadRequest

from rex.core import Error
from rex.web import confine, authorize
from rex.widget.render import render

from .mount import MountedAction

__all__ = ('ActionRenderer',)


class ActionRenderer(object):

    def __init__(self, path, action, access, package):
        self.path = path
        self._action = action
        self.access = access or package.name
        self.package = package

    @cached_property
    def action(self):
        if isinstance(self._action, MountedAction):
            return self._action
        else:
            return self._action()

    def validate(self):
        self.action.typecheck()

    def __call__(self, request):
        if not authorize(request, self.access):
            raise HTTPUnauthorized()
        try:
            with confine(request, self):
                own, via_path, _ = self.path
                params = match(own, request.path_info)
                if params is not None:
                    return render(self.action, request)
                params = match(via_path, request.path_info)
                if params is not None:
                    return render(self.action, request, path=params['path'])
                raise HTTPBadRequest()

        except Error as error:
            return request.get_response(error)


def match(mask, path):
    try:
        return mask(path)
    except ValueError:
        return None
