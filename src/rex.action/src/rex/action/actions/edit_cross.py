"""

    rex.action.actions.edit_cross
    =============================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import StrVal
from rex.port import Port
from rex.widget import Field, undefined

from .. import typing
from .form_action import FormAction

__all__ = ('EditCross',)


class EditCross(FormAction):
    """ Edit a cross entity.
    """

    name = 'edit-cross'
    js_type = 'rex-action/lib/actions/EditCross'

    submit_button = Field(
        StrVal(), default=undefined,
        doc="""
        Text for submit button.
        """)

    def context(self):
        input = self.input if self.input.rows else self._computed_input_type
        output = self.domain.record(self.entity)
        return input, output

    @cached_property
    def _computed_input_type(self):
        name = self.entity.type.name
        port = Port(name, db=self.db)
        tree = port.tree.arms[name]
        pks = tree.arc.target.table.primary_key.origin_columns
        rows = []
        for pk in pks:
            if not pk.foreign_keys:
                raise Error('Invalid cross table specified:', name)
            for fk in pk.foreign_keys:
                rows.append(
                    typing.RowType(
                        fk.target.name,
                        typing.EntityType(fk.target.name)))
        return self.domain.record(*rows)
