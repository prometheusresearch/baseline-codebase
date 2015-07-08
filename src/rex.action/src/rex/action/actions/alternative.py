"""

    rex.action.actions.alternative
    ==============================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import SeqVal, Error
from rex.widget import Field

from ..action import Action, ActionVal

__all__ = ('Alternative',)


class Alternative(Action):

    name = 'alternative'
    js_type = 'rex-action/lib/Actions/Alternative'

    actions = Field(
        SeqVal(ActionVal()),
        doc="""
        Actions.
        """)

    def context(self):
        contexts = [(action.context(), action) for action in self.actions]
        context, _ = reduce(self._check_context, contexts)
        return context

    def _check_context(self, prev, curr):
        (prev_input, prev_output), prev_action = prev
        (curr_input, curr_output), curr_action = curr
        if prev_input != curr_input:
            raise Error(
                'Incompatible context inputs for alternative action',
                '%r from %s\n%r from %s' % (
                    prev_input, prev_action.id, curr_input, curr_action.id))
        if prev_output != curr_output:
            raise Error(
                'Incompatible context outputs for alternative action',
                '%r from %s\n%r from %s' % (
                    prev_output, prev_action.id, curr_output, curr_action.id))
        return curr
