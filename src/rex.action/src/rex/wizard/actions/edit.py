"""

    rex.wizard.actions.edit
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from collections import OrderedDict

from rex.core import MaybeVal, SeqVal, StrVal, MapVal, OMapVal
from rex.port import Port
from rex.widget import Field, FormFieldVal, responder, PortURL
from rex.widget import formfield, dataspec

from ..action import Action
from ..dataspec import ContextBinding
from ..validate import EntityDeclarationVal

__all__ = ('Edit',)


class Edit(Action):
    """ Edit an entity.


    Example action declaration (``action.yaml``)::

        - type: edit
          id: edit-individual
          entity: individual

    The set of fields will be inferred automatically for a given ``entity``.

    To configure a specified set of fields use ``fields`` parameter::

        - type: edit
          id: edit-individual
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

    name = 'edit'
    js_type = 'rex-wizard/lib/Actions/Edit'

    entity = Field(
        EntityDeclarationVal(),
        doc="""
        Name of a table in database.
        """)

    fields = Field(
        MaybeVal(SeqVal(FormFieldVal())), default=None,
        doc="""
        A list of fields to show.

        If not specified then it will be generated automatically based on the
        data schema.
        """)

    input = Field(
        OMapVal(StrVal(), StrVal()), default=OrderedDict())

    def __init__(self, **values):
        super(Edit, self).__init__(**values)
        if self.fields is None:
            self.values['fields'] = formfield.from_port(self.port)
        else:
            self.values['fields'] = formfield.enrich(self.fields, self.port)

    @cached_property
    def port(self):
        if self.fields is None:
            return Port(self.entity.type)
        else:
            return formfield.to_port(self.entity.type, self.fields)

    def _construct_data_spec(self, port_url):
        keys = self.input.keys() or [self.entity.name]
        params = {'*': ContextBinding(keys, is_join=True)}
        return dataspec.EntitySpec(port_url, params)

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        input = self.input or {self.entity.name: self.entity.type}
        output = {self.entity.name: self.entity.type}
        return input, output


