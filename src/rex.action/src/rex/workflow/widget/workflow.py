"""

    rex.workflow.widget.workflow
    ============================

    This module provides :class:`rex.workflow.workflow.Workflow` implementation.

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import Mapping

from rex.core import cached, Validate
from rex.core import OMapVal, StrVal, ProxyVal, OneOfVal, MaybeVal
from rex.widget.modern import Field

from .base import WorkflowWidget

__all__ = ('Workflow',)


class ActivityTreeVal(Validate):

    _validate = ProxyVal()
    _validate_activity = MaybeVal(_validate)
    _validate.set(OMapVal(StrVal(), _validate_activity))

    def __call__(self, value):
        # TODO: validate context requirements here
        return self._validate(value)


class Workflow(WorkflowWidget):

    name = 'Workflow'
    js_type = 'rex-workflow/lib/Workflow'
    workflow_type = None


    activities = Field(
        ActivityTreeVal(),
        doc="""
        A configuration of allowed activities within the workflows and
        transitions between them.
        """)

    @cached
    def descriptor(self):
        desc = super(Workflow, self).descriptor()
        props = desc.ui.props
        used_activities_ids = _all_keys(props.activities)
        props.activity_tree = props.activities
        props.activities = {activity.id: activity.render()
                            for activity in Activity.all()
                            if activity.id in used_activities_ids}
        return desc


def _all_keys(d):
    keys = set()
    queue = [d]
    while queue:
        c = queue.pop()
        keys = keys | set(c.keys())
        queue = queue + [v for v in c.values() if isinstance(v, Mapping)]
    return keys

