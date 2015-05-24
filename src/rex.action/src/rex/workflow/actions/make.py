"""

    rex.workflow.actions.make
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import MaybeVal, SeqVal, StrVal, MapVal
from rex.port import Port
from rex.widget import Field, FormFieldVal, responder, PortURL
from rex.widget import formfield, dataspec

from ..action import Action
from ..validate import EntityDeclarationVal

__all__ = ('Make',)


class Make(Action):
    """ Make an entity.

    This is an action which renders a form to create a new entity.

    Example action declaration (``actions.yaml``)::

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
    js_type = 'rex-workflow/lib/Actions/Make'

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

    value = Field(
        MapVal(StrVal(), StrVal()), default={},
        doc="""
        An initial value.

        It could reference data from the current context via ``$name``
        references::

            study: $study
            individual: $individual

        """)

    def __init__(self, **values):
        super(Make, self).__init__(**values)
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
        return dataspec.EntitySpec(port_url, {})

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        input = {v[1:]: v[1:] for v in self.value.values() if v.startswith('$')}
        output = {self.entity.name: self.entity.type}
        return input, output

