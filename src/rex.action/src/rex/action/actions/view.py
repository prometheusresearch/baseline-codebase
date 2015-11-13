"""

    rex.action.actions.view
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.port import Port
from rex.widget import Field, responder, PortURL
from rex.widget import dataspec

from ..dataspec import ContextBinding
from ..typing import RecordTypeVal, RecordType
from .entity_action import _EntityAction as EntityAction

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
    js_type = 'rex-action/lib/actions/View'
    dataspec_factory = dataspec.EntitySpec

    input = Field(
        RecordTypeVal(), default=RecordType.empty())

    def context(self):
        input = self.input if self.input.rows else self.domain.record(self.entity)
        return input, self.domain.record()

    def bind_port(self):
        return {'*': ContextBinding([self.entity.name], is_join=False)}
