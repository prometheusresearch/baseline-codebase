"""

    rex.workflow.paneled_workflow
    =============================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.widget import Field

from .workflow import Workflow
from .action_tree import ActionTreeVal

__all__ = ('PaneledWorkflow',)


class PaneledWorkflow(Workflow):

    name = 'paneled'
    js_type = 'rex-workflow/lib/Workflow'

    actions = Field(
        ActionTreeVal(),
        doc="""
        """)
