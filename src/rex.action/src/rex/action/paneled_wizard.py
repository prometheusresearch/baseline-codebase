"""

    rex.action.paneled_wizard
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.widget import Field

from .wizard import Wizard
from .action_tree import ActionTreeVal

__all__ = ('PaneledWizard',)


class PaneledWizard(Wizard):
    """ Wizard which renders actions as panels side-by-side.

    Example wizard declaration as URL mapping entry::

        paths:
          /study-enrollment:
            wizard:
              actions:
                home:
                  pick-individual:
                    pick-study:
                      make-study-enrollment
                  make-individual:

    The only required parameter is ``actions`` which specify a tree of actions.
    Tree of actions represents a set of possible transitions within the
    wizard. The initial step is the root and each leave represents an
    alternative final step in the wizard.
    """

    name = 'paneled'
    js_type = 'rex-action/lib/Wizard'

    actions = Field(
        ActionTreeVal(),
        doc="""
        A tree of actions.
        """)
