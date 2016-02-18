"""

    rex.action.map
    ==============

    :copyright: 2015, Prometheus Research, LLC

"""

import yaml
from cached_property import cached_property
from webob.exc import HTTPUnauthorized, HTTPBadRequest

from rex.core import (
    StrVal, Error, AnyVal, MapVal, RecordVal,
    set_location, Location)
from rex.widget.validate import DeferredVal, Deferred
from rex.widget.render import render
from rex.urlmap import Map
from rex.web import authorize, confine, PathMask

from .action import ActionBase, ActionVal, override as override_action
from .wizard import WizardBase
from .widget import ActionWizard


class MapAction(Map):

    fields = [
        ('action', DeferredVal()),
        ('override', AnyVal(), None),
        ('access', StrVal(), None),
    ]

    validate_override = DeferredVal()

    @classmethod
    def is_main_path(self, path):
        return (
            '@@' not in path.text and
            '@' not in path.text
        )

    def mask(self, path):
        sanitized_path = path
        if sanitized_path.endswith('/'):
            sanitized_path = sanitized_path[:-1]
        return [
            PathMask(path),
            PathMask('%s/@@/{path:*}' % sanitized_path),
            PathMask('%s/@/{action:*}' % sanitized_path),
        ]

    def override_at(self, spec, override_spec, path, override_path):

        action_val = ActionVal(
            package=self.package,
            id='%s:%s' % (self.package.name, path[0]))

        def make_override(spec):
            if is_replace_override_spec(override_spec):
                return lambda action: spec.resolve(action_val)
            else:
                return lambda action: override_action(action, spec)

        if path == override_path:
            override = spec.override or []
            return spec.__clone__(override=override + [make_override(override_spec)])

        _, _, action_path = self.mask(path)

        params = match(action_path, override_path)
        if params is not None:
            key = params['action']
            if spec.override:
                override_actions = dict(spec.override.override_actions)
            else:
                override_actions = {}
            override_actions.setdefault(key, []).append(make_override(override_spec))
            override = lambda action: override_action(action, override_actions)
            setattr(override, 'override_actions', override_actions)
            return spec.__clone__(override=override)

        raise Error('Invalid action override at path:', override_path)

    def __call__(self, spec, path, context):

        id = '%s:%s' % (self.package.name, path[0])

        action_val = ActionVal(package=self.package, id=id)

        def _create_action():
            action = spec.action.resolve(action_val)
            action._introspection = action.Introspection(
                action, id, spec.access, spec.action.source_location)
            if spec.override:
                if isinstance(spec.override, list):
                    for override in spec.override:
                        action = override(action)
                else:
                    action = spec.override(action)
            return action

        return ActionRenderer(
            path,
            _create_action,
            spec.access,
            self.package)


def match(mask, path):
    try:
        return mask(path)
    except ValueError:
        return None


def is_replace_override_spec(override):
    is_type_field = lambda node: (
        isinstance(node, yaml.ScalarNode) and
        node.tag == 'tag:yaml.org,2002:str' and
        node.value == 'type'
    )
    return any(is_type_field(key_node) for key_node, _ in override.node.value)


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
