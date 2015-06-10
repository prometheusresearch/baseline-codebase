"""

    rex.action.actions.edit
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from collections import OrderedDict

from rex.core import MaybeVal, SeqVal, StrVal, AnyVal, MapVal, OMapVal
from rex.port import Port
from rex.widget import Field, FormFieldsetVal, responder, PortURL
from rex.widget import formfield, dataspec

from ..action import Action
from ..dataspec import ContextBinding
from ..validate import EntityDeclarationVal, RexDBVal

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
    js_type = 'rex-action/lib/Actions/Edit'

    entity = Field(
        EntityDeclarationVal(),
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

    value = Field(
        MapVal(StrVal(), AnyVal()), default={},
        doc="""
        Initial form value which will be merged with entity fetched from
        database.
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
            return Port(self.entity.type, db=self.db)
        else:
            value_fields = _value_to_fieldset(self.value).fields
            return formfield.to_port(self.entity.type, value_fields + self.fields, db=self.db)

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


def _value_to_fieldset(value, _key=None):
    _key = _key or ['__root__']
    if isinstance(value, dict):
        return formfield.Fieldset(
            value_key=_key,
            fields=[_value_to_fieldset(v, _key=[k]) for k, v in value.items()])
    else:
        return formfield.StringFormField(value_key=_key)
