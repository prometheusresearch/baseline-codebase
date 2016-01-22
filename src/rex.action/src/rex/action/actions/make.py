"""

    rex.action.actions.make
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import OrderedDict

from webob.exc import HTTPBadRequest

from rex.core import StrVal
from rex.widget import Field, undefined

from ..typing import RecordTypeVal, RecordType
from .form_action import FormAction

__all__ = ('Make',)


class Make(FormAction):
    """ Make an entity.

    This is an action which renders a form to create a new entity.

    Example action declaration (``action.yaml``)::

        - type: make
          id: make-individual
          entity: individual

    The set of fields will be inferred automatically for a given ``entity``.

    To configure a specified set of fields use ``fields`` parameter::

        - type: make
          id: make-individual
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

    name = 'make'
    js_type = 'rex-action/lib/actions/Make'

    submit_button = Field(
        StrVal(), default=undefined,
        doc="""
        Text for submit button.
        """)

    input = Field(
        RecordTypeVal(), default=RecordType.empty())

    def context(self):
        return self.input, self.domain.record(self.entity)
