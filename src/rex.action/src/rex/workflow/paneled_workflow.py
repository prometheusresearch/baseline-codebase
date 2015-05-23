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
    """ Workflow which renders actions as panels side-by-side.

    Example workflow declaration as URL mapping entry::

        paths:
          /study-enrollment:
            workflow:
              actions:
                home:
                  pick-individual:
                    pick-study:
                      make-study-enrollment
                  make-individual:
                    
    The only required parameter is ``actions`` which specify a tree of actions.
    Tree of actions represents a set of possible transitions within the
    workflow. The initial step is the root and each leave represents an
    alternative final step in the workflow.
    """

    name = 'paneled'
    js_type = 'rex-workflow/lib/Workflow'

    actions = Field(
        ActionTreeVal(),
        doc="""
        A tree of actions.
        """)
