"""

    rex.action.map
    ==============

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property
from webob.exc import HTTPUnauthorized, HTTPBadRequest

from rex.core import StrVal, Error
from rex.widget.validate import DeferredVal, Deferred
from rex.widget.render import render
from rex.urlmap import Map
from rex.web import authorize, confine, PathMask

from .action import ActionVal
from .wizard import WizardBase
from .widget import ActionWizard

class MapAction(Map):

    fields = [
        ('action', DeferredVal()),
        ('access', StrVal(), None),
    ]

    def mask(self, path):
        if path.endswith('/'):
            sub_path = '%s@/{path:*}' % path
        else:
            sub_path = '%s/@/{path:*}' % path
        return [
            PathMask(path),
            PathMask(sub_path),
        ]

    def __call__(self, spec, path, context):
        return ActionRenderer(path, spec.action, spec.access, self.package)


def match(mask, request):
    try:
        return mask(request.path_info)
    except ValueError:
        return None


class ActionRenderer(object):

    def __init__(self, path, action, access, package):
        self.path = path
        self._action = action
        self.access = access or package.name
        self.package = package

    @cached_property
    def action(self):
        if isinstance(self._action, Deferred):
            action_id = '%s:%s' % (self.package.name, self.path)
            return self._action.resolve(ActionVal(package=self.package, id=action_id))
        else:
            return self._action

    def validate(self):
        # We force computed property so that action is instantiated and
        # validated.
        #self.action.typecheck()
        pass

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
                own, via_path = self.path
                params = match(own, request)
                if params is not None:
                    return render(action, request)
                params = match(via_path, request)
                if params is not None:
                    return render(action, request, path=params['path'])
                raise HTTPBadRequest()

        except Error, error:
            return request.get_response(error)
