"""

    rex.action.mount
    ================

    Actions which are mounted as entry points.

    :copyright: 2015-recent, Prometheus Research, LLC

"""



from rex.core import get_settings, Validate
from rex.widget.transitionable import as_transitionable
from rex.widget.widget import _format_Widget

from .action import Action, ActionBase, _format_Action
from .validate import ActionVal
from .wizard import WizardBase, visit_wizards
from .widget import ActionWizard

__all__ = ('MountedAction', 'MountedActionVal')


class MountedAction(object):
    """ Wraps an action along with a metadata needed for this action to serve as
    an entry point.

    Instances shouldn't be created directly but rather via
    :class:`MountedActionVal` validator.
    """

    def __init__(self, action, domain, action_map):
        self.action = action
        self.domain = domain
        self.action_map = action_map


@as_transitionable(MountedAction, tag='widget')
def _format_MountedAction(action, req, path):  # pylint: disable=invalid-name
    if isinstance(action.action, ActionBase):
        package_name, symbol_name, props = _format_Action(action.action, req, path)
        props['actions'] = action.action_map
        props['domain'] = action.domain
    else:
        package_name, symbol_name, props = _format_Widget(action.action, req, path)
    return package_name, symbol_name, props


class MountedActionVal(Validate):

    def __init__(self, action_class=Action, action_base=None, package=None):
        super(MountedActionVal, self).__init__()
        self.delegate = ActionVal(
            action_class=action_class,
            action_base=action_base,
            package=package)

    def mount(self, action):
        action_map = {}
        domain = action.domain

        action.typecheck()

        if isinstance(action, WizardBase):
            actions_collected = []

            def _collect_action_map(wizard, path):
                for key, action in list(wizard.actions.items()):
                    key = '@'.join(path + (key,))
                    actions_collected.append((key, action))
            visit_wizards(action, _collect_action_map)

            seen = {}
            for key, child_action in sorted(actions_collected):
                if child_action.uid in seen:
                    action_map[key] = {'$ref': seen[child_action.uid]}
                else:
                    action_map[key] = child_action
                    seen[child_action.uid] = key

        if not isinstance(action, WizardBase):
            action = ActionWizard(action=action)

        return MountedAction(action, domain, action_map)

    def __call__(self, action):
        if not isinstance(action, ActionBase):
            action = self.delegate(action)
        return self.mount(action)

    def construct(self, loader, node):
        def wrapper():
            action = self.delegate.construct(loader, node)
            return self.mount(action)
        immediate = get_settings().rex_action_validate_on_startup
        return wrapper() if immediate else wrapper 
