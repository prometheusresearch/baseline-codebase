"""

    rex.action.wizard
    =================

    This module provides :class:`Wizard` widget which is used to render and
    orchestrate actions.

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import AnyVal, StrVal, MapVal
from rex.widget import Widget, Field
from rex.widget.validate import DeferredVal

from .action_tree import ActionTreeVal, anytype
from .action import ActionMapVal

__all__ = ('Wizard',)


class Wizard(Widget):
    """ Widget which renders actions as panels side-by-side.

    Example declaration as URL mapping entry::

        paths:
          /study-enrollment:
            widget: !<Wizard>

              path:
              - home:
                - pick-individual:
                  - pick-study:
                    - make-study-enrollment
                - make-individual:

              actions:
                home: ...
                pick-individual: ...
                make-study-enrollment: ...
                make-individual: ...

    The only required parameter is ``actions`` which specify a tree of actions.
    Tree of actions represents a set of possible transitions.

    The initial step is the root and each leave represents an alternative final
    step.
    """

    name = 'Wizard'
    js_type = 'rex-action/lib/Wizard'

    path = Field(
        DeferredVal(),
        doc="""
        Wizard path specified as a tree of possible transitions between actions.
        """)

    actions = Field(
        ActionMapVal(),
        doc="""
        Wizard actions.
        """)

    initial_context = Field(
        MapVal(StrVal(), AnyVal()), default=None,
        doc="""
        Initial context.
        """)

    def __init__(self, **values):
        super(Wizard, self).__init__(**values)
        initial_context_type = None
        if self.initial_context:
            initial_context_type = {k: (anytype, None) for k in self.initial_context}
        validate_path = ActionTreeVal(self.actions, context=initial_context_type)
        path = self.path.resolve(validate_path)
        self.values['path'] = path
