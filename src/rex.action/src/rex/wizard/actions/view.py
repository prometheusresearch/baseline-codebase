"""

    rex.wizard.actions.view
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import MaybeVal, SeqVal, StrVal
from rex.port import Port
from rex.widget import Field, FormFieldVal, responder, PortURL
from rex.widget import formfield, dataspec

from ..action import Action
from ..validate import EntityDeclarationVal

__all__ = ('View',)


class View(Action):
    """ View information about specified entity.

    Example action declaration (``actions.yaml``)::

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
    js_type = 'rex-wizard/lib/Actions/View'

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

    def __init__(self, **values):
        super(View, self).__init__(**values)
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
        params = {'*': dataspec.PropBinding('context.%s' % self.entity.name)}
        return dataspec.EntitySpec(port_url, params)

    @responder(wrap=_construct_data_spec, url_type=PortURL)
    def data(self, req):
        return self.port(req)

    def context(self):
        input = {self.entity.name: self.entity.type}
        output = {}
        return input, output
