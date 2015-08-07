"""

    rex.action.actions.view
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import OrderedDict

from cached_property import cached_property

from rex.core import MaybeVal, SeqVal, StrVal, OMapVal
from rex.port import Port
from rex.widget import Field, FormFieldsetVal, responder, PortURL
from rex.widget import formfield, dataspec

from ..action import Action
from ..dataspec import ContextBinding
from ..validate import RexDBVal
from ..typing import RowTypeVal, RecordTypeVal, RecordType

__all__ = ('View',)


class View(Action):
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
    js_type = 'rex-action/lib/Actions/View'

    entity = Field(
        RowTypeVal(),
        doc="""
        Name of a table in database.
        """)

    db = Field(
        RexDBVal(), default=None,
        transitionable=False,
        doc="""
        Database to use.
        """)

    fields = Field(
        MaybeVal(FormFieldsetVal()), default=None,
        doc="""
        A list of fields to show.

        If not specified then it will be generated automatically based on the
        data schema.
        """)

    input = Field(
        RecordTypeVal(), default=RecordType.empty())

    def __init__(self, **values):
        super(View, self).__init__(**values)
        if self.fields is None:
            self.values['fields'] = formfield.from_port(self.port)
        else:
            self.values['fields'] = formfield.enrich(self.fields, self.port)

    @cached_property
    def port(self):
        if self.fields is None:
            return Port(self.entity.type.name, db=self.db)
        else:
            return formfield.to_port(self.entity.type.name, self.fields, db=self.db)

    def _construct_data_spec(self, port_url):
        keys = self.input.rows.keys() or [self.entity.name]
        params = {'*': ContextBinding(keys, is_join=True)}
        return dataspec.EntitySpec(port_url, params)

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        input = self.input if self.input.rows else self.domain.record(self.entity)
        return input, self.domain.record()
