"""

    rex.action.actions.edit
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal
from rex.port import Port
from rex.widget import Field, undefined

from ..typing import RecordTypeVal, RecordType
from .form_action import FormAction

__all__ = ('Edit',)


class Edit(FormAction):
    """
    Edit an entity.

    If ``query`` is provided, then it is used to store the data in the
    database. In this case all the fields declared become **$references** named
    the same as their respective ``value_key``.
    """

    name = 'edit'
    js_type = 'rex-action', 'Edit'

    class Configuration(FormAction.Configuration):

        def reconcile_input(self, entity, input):
            if not entity.name in input.rows:
                input = RecordType(list(input.rows.values()) + [entity])
            return input

    submit_button = Field(
        StrVal(), default=undefined,
        doc="""
        Text for submit button.
        """)

    def context(self):
        input = self.input
        if not self.entity.name in input.rows:
            input = RecordType(list(input.rows.values()) + [self.entity])
        return input, RecordType([self.entity])
