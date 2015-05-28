"""

    rex.action.wizard
    =================

    This module provides :class:`Wizard` widget which is used to render and
    orchestrate actions.

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.widget import Widget, Field
from .action_tree import ActionTreeVal

__all__ = ('Wizard',)


class Wizard(Widget):
    """ Widget which renders actions as panels side-by-side.

    Example declaration as URL mapping entry::

        paths:
          /study-enrollment:
            widget: !<Wizard>
              actions:
                home:
                  pick-individual:
                    pick-study:
                      make-study-enrollment
                  make-individual:

    The only required parameter is ``actions`` which specify a tree of actions.
    Tree of actions represents a set of possible transitions.

    The initial step is the root and each leave represents an alternative final
    step.
    """

    name = 'Wizard'
    js_type = 'rex-action/lib/Wizard'

    actions = Field(
        ActionTreeVal(),
        doc="""
        A tree of actions.
        """)
