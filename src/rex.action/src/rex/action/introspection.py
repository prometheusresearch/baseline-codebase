"""

    rex.action.introspection
    ========================

    This module provides introspection capabilities for Rex Action based
    applications.

    :copyright: 2016, Prometheus Research, LLC

"""

from collections import OrderedDict

from cached_property import cached_property

from rex.core import get_packages, get_settings, autoreload
from rex.web import get_routes
from rex.widget import raw_widget

from . import instruction
from . import validate

__all__ = (
    'ActionIntrospection', 'WizardIntrospection',
    'introspect_action', 'introspect_actions')


class ActionIntrospection(object):
    """ Action introspection interface.
    """

    info_js_type = 'rex-action/lib/inspect/ActionInfo'
    detailed_info_js_type = 'rex-action/lib/inspect/DetailedActionInfo'

    def __init__(self, action, path=None, access=None, location=None):
        self.action = action
        self.path = path
        self.access = access
        self.location = location

    def transfer(self, action, path=None, access=None, location=None):
        path = path if path is not None else self.path
        access = access if access is not None else self.access
        location = location if location is not None else self.location
        return self.__class__(
            action,
            path=path,
            access=access,
            location=location)

    @property
    def id(self):
        return self.action.id

    @property
    def title(self):
        return self.action.title or None

    @property
    def doc(self):
        return self.action.doc or None

    @property
    def type(self):
        return self.action.__class__.name.name

    @property
    def context_types(self):
        return self.action.context_types

    @cached_property
    def source(self):
        """ A snippet of configuration which leads to the introspectable action.
        """
        if self.location is None:
            return None
        return get_source(self.location)

    def info(self, debug=False, detailed=False):
        return {
            'path': self.path,
            'id': self.id,
            'contextTypes': {
                'input': self.context_types.input,
                'output': self.context_types.output,
            },
            'access': self.access,
            'type': self.type,
            'title': self.title,
            'location': self.location,
            'doc': self.doc if detailed else None,
            'source': self.source if detailed  else None,
        }

    def info_widget(self):
        debug = get_settings().debug
        return raw_widget(
            self.info_js_type,
            info=self.info(debug=debug))

    def detailed_info_widget(self):
        debug = get_settings().debug
        return raw_widget(
            self.detailed_info_js_type,
            info=self.info(debug=debug, detailed=True))


class WizardIntrospection(ActionIntrospection):
    """ Wizard introspection interface.
    """

    info_js_type = 'rex-action/lib/inspect/WizardInfo'
    detailed_info_js_type = 'rex-action/lib/inspect/DetailedWizardInfo'

    def _introspect_path(self, instruction, ancestors):
        if hasattr(instruction, 'action_instance'):
            action_introspection = instruction.action_instance._introspection
            if action_introspection is None:
                action_introspection = instruction.action_instance.Introspection(
                    instruction.action_instance)
            instruction = instruction.__clone__(
                action_instance=action_introspection.info_widget())
        return instruction

    def info(self, debug=False, detailed=False):
        info = super(WizardIntrospection, self).info(
                detailed=detailed,
                debug=debug)
        if detailed:
            path = instruction.map(self.action.path, self._introspect_path)
            info.update({
                'wizardPath': path
            })
        return info


def get_source(range):
    """ Get source for a specific range.
    """
    if range is None:
        return None
    name, start, end = range
    with open(name, 'r') as f:
        lines = list(f)
        lines = lines[start.line:end.line]
        indent = get_indent(lines[0]) if lines else 0
        lines = [line[indent:] for line in lines]
        return ''.join(lines)

def get_indent(line):
    """ Get line indent.
    """
    return len(line) - len(line.lstrip())


@autoreload
def _introspect_actions(open=open):
    def _generate():
        for package in get_packages():
            routes = get_routes(package)
            for path in routes:
                handler = routes[path]
                if not hasattr(handler, 'action'):
                    continue
                # Skip non-main path
                if '@' in path.text:
                    continue
                path = '%s:%s' % (package.name, path.text)

                if not handler.action._introspection:
                    continue
                yield path, handler.action._introspection

                if hasattr(handler.action, 'actions'):
                    for id, action in handler.action.actions.items():
                        if isinstance(action, validate.ActionReference):
                            continue
                        if not action._introspection:
                            continue
                        yield '%s/@/%s' % (path, id), action._introspection

    actions = OrderedDict(item for item in _generate())
    return actions


def introspect_actions():
    """ List all actions in a current application.
    """
    return OrderedDict(
        (path, action)
        for path, action in _introspect_actions().items()
        if not '@' in path)

def introspect_action(path):
    """ Get introspection info for an action specified by a ``path`` it is
    mounted in URL mapping.
    """
    return _introspect_actions().get(path)
