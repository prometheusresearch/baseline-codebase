"""

    rex.action.map
    ==============

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property
from webob.exc import HTTPUnauthorized, HTTPBadRequest

from rex.core import StrVal, Error, AnyVal, MapVal, RecordVal
from rex.widget.validate import DeferredVal, Deferred
from rex.widget.render import render
from rex.urlmap import Map
from rex.web import authorize, confine, PathMask

from .action import ActionBase, ActionVal, _action_sig
from .wizard import WizardBase
from .widget import ActionWizard


class MapAction(Map):

    fields = [
        ('action', DeferredVal()),
        ('override', MapVal(AnyVal(), AnyVal()), {}),
        ('access', StrVal(), None),
    ]

    validate_override_self = RecordVal([
        (pair[0], pair[1], None) for pair in fields
    ])
    validate_pre = MapVal(StrVal(), DeferredVal())
    validate_override = DeferredVal()

    def mask(self, path):
        origin = path
        if origin.endswith('/'):
            origin = origin[:-1]
        return [
            PathMask(path),
            PathMask('%s/@@/{path:*}' % origin),
            PathMask('%s/@/{action:*}' % origin),
        ]

    def override_at(self, spec, override_spec, path, override_path):
        if path == override_path:
            spec = spec.__clone__(override=(spec.override or []) + [override_spec])
            return spec

        _, _, via_action = self.mask(path)

        params = match(via_action, override_path)
        if params is not None:
            key = params['action']
            override = dict(spec.override)
            if key in override:
                override[key] = override[key][:]
            else:
                override[key] = []
            override[key].append(override_spec)
            spec = spec.__clone__(override=override)
            return spec

        raise Error('Invalid action override at path:', override_path)

    def override(self, spec, override_spec):
        if hasattr(override_spec, 'access') and override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        return spec

    def __call__(self, spec, path, context):
        return ActionRenderer(
            path,
            spec.action,
            spec.override,
            spec.access,
            self.package)


def match(mask, path):
    try:
        return mask(path)
    except ValueError:
        return None


class ActionRenderer(object):

    def __init__(self, path, action, override, access, package):
        self.path = path
        self._action = action
        self.override = override
        self.access = access or package.name
        self.package = package

    @cached_property
    def action(self):
        if isinstance(self._action, Deferred):
            action_id = '%s:%s' % (self.package.name, self.path)
            action = self._action.resolve(ActionVal(package=self.package, id=action_id))
            if self.override:
                if isinstance(self.override, list):
                    for override in self.override:
                        action = action._configuration._apply_override(action, override)
                else:
                    action = action._configuration._apply_override(action, self.override)
            return action
        else:
            return self._action

    def validate(self):
        # We force computed property so that action is instantiated and
        # validated.
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
