"""

    rex.action.actions.view
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.port import Port
from rex.core import IntVal
from rex.widget import Field, responder, PortURL, undefined

from ..typing import RecordTypeVal, RecordType
from .entity_action import EntityAction

__all__ = ('View',)


class View(EntityAction):
    """ View information about specified entity.

    Example action declaration (``action.yaml``)::

        - type: view
          id: view-individual
          entity: individual

    The set of fields will be inferred automatically for a given ``entity``.

    To configure a specified set of fields use ``fields`` parameter::

        - type: view
          id: view-individual
          entity: individual
          fields:
          - code
          - identity.sex
          - identity.givenname
            label: First Name
          - identity.surname
            label: Last Name

    Fields can be declared as a key path within the record, see ``code`` and
    ``identity.sex`` fields above (in this case label and other info will be
    inferred from schema) or completely with label and other parameters.
    """

    name = 'view'
    js_type = 'rex-action', 'View'

    class Configuration(EntityAction.Configuration):

        def reconcile_input(self, entity, input):
            if not entity.name in input.rows:
                input = RecordType(input.rows.values() + [entity])
            return input

    input = Field(
        RecordTypeVal(), default=RecordType.empty())

    refresh_interval = Field(
        IntVal(), default=undefined,
        doc="Refresh data periodically (interval is specified in seconds)")

    def context(self):
        input = self.input
        if not self.entity.name in input.rows:
            input = RecordType(input.rows.values() + [self.entity])
        return input, self.domain.record()
