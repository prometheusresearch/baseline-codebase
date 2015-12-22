"""

    rex.action.actions.view_cross
    =============================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.port import Port
from rex.widget import Field, responder, PortURL
from rex.widget import dataspec

from .. import typing
from .entity_action import EntityAction

__all__ = ('ViewCross',)


class ViewCross(EntityAction):
    """ View cross action.

    Example::

      type: wizard

      path:
      - pick-user:
        - pick-study:
          - view-study_x_user:

      actions:
        pick-user:
          type: pick
          entity:
              remote_user: user

        pick-study:
          type: pick
          entity: study

        view-study_x_user:
          type: view-cross
          entity: study_x_user
          input:
          - remote_user: user
          - study: study

    """

    name = 'view-cross'
    js_type = 'rex-action/lib/actions/ViewCross'

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
