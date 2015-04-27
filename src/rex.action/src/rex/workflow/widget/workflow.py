"""

    rex.workflow.widget.workflow
    ============================

    This module provides :class:`rex.workflow.workflow.Workflow` implementation.

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import Mapping

from rex.core import cached, Validate
from rex.core import MapVal, StrVal, ProxyVal, OneOfVal, MaybeVal
from rex.widget.modern import Field

from ..action import load_actions
from .base import WorkflowWidget

__all__ = ('Workflow',)


class ActionTreeVal(Validate):

    _validate = ProxyVal()
    _validate_action = _validate
    # TODO: we should use OMapVal here
    _validate.set(MaybeVal(MapVal(StrVal(), _validate_action)))

    def __call__(self, value):
        # TODO: validate context requirements here
        return self._validate(value)


class Workflow(WorkflowWidget):

    type = None
    name = 'Workflow'
    js_type = 'rex-workflow/lib/Workflow'

    actions = Field(
        ActionTreeVal(),
        doc="""
        A configuration of allowed actions within the workflows and
        transitions between them.
        """)

    @cached
    def descriptor(self):
        desc = super(Workflow, self).descriptor()
        props = desc.ui.props
        used_action_ids = collect_keys(props.actions)
        props.actions_tree = props.actions
        props.actions = {action.id: action.render()
                         for action in load_actions(self.package)
                         if action.id in used_action_ids}
        return desc


def collect_keys(d):
    keys = set()
    if not d:
        return keys
    queue = [d]
    while queue:
        c = queue.pop()
        keys = keys | set(c.keys())
        queue = queue + [v for v in c.values() if isinstance(v, Mapping)]
    return keys

