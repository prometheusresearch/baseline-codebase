"""

    rex.action.actions.make
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import OrderedDict

from cached_property import cached_property

from rex.core import MaybeVal, SeqVal, StrVal, MapVal, AnyVal, OMapVal
from rex.port import Port
from rex.widget import Field, FormFieldsetVal, responder, PortURL, undefined
from rex.widget import formfield, dataspec

from ..action import Action
from ..validate import EntityDeclarationVal, RexDBVal

__all__ = ('Make',)


class Make(Action):
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
    js_type = 'rex-action/lib/Actions/Make'

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
        An initial value.

        It could reference data from the current context via ``$name``
        references::

            study: $study
            individual: $individual

        """)

    submit_button = Field(
        StrVal(), default=undefined,
        doc="""
        Text for submit button.
        """)

    input = Field(
        OMapVal(StrVal(), StrVal()), default=OrderedDict())

    def __init__(self, **values):
        super(Make, self).__init__(**values)
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
            value_fields = formfield.enrich(value_fields, Port(self.entity.type, db=self.db))
            return formfield.to_port(self.entity.type, value_fields + self.fields, db=self.db)

    def _construct_data_spec(self, port_url):
        return dataspec.EntitySpec(port_url, {})

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        input = self.input or {}
        output = {self.entity.name: self.entity.type}
        return input, output


def _value_to_fieldset(value, _key=None):
    _key = _key or ['__root__']
    if isinstance(value, dict):
        return formfield.Fieldset(
            value_key=_key,
            fields=[_value_to_fieldset(v, _key=[k]) for k, v in value.items()])
    elif isinstance(value, list):
        merged = {}
        for item in value:
            merged.update(item)
        return formfield.List(
            value_key=_key,
            fields=[_value_to_fieldset(v, _key=[k]) for k, v in merged.items()])
    else:
        return formfield.StringFormField(value_key=_key)
