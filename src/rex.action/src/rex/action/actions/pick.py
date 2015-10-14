"""

    rex.action.actions.pick
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal, SeqVal, MaybeVal, BoolVal, RecordVal
from rex.port import Port
from rex.widget import Field, ColumnVal, undefined
from rex.widget import dataspec

from ..dataspec import ContextBinding
from ..typing import RecordTypeVal, RecordType
from .entity_action import EntityAction

__all__ = ('Pick',)


class Pick(EntityAction):
    """ Show a list of records in database.

    This is a generic action which displays a list of records in database as a
    configurable datatable. Each item in the list can be selected by clicking on
    it.

    Example action declaration (``action.yaml``)::

        - type: pick
          id: pick-individual
          entity: individual

    """

    name = 'pick'
    js_type = 'rex-action/lib/actions/Pick'
    dataspec_factory = dataspec.CollectionSpec

    columns = Field(
        MaybeVal(SeqVal(ColumnVal())), default=None,
        transitionable=False,
        deprecated='Use "fields" instead')

    search = Field(
        StrVal(), default=None,
        doc="""
        HTSQL expression which is used to search for a term.

        For full text search ``ft_query_matches`` HTSQL function could be used::

            search: ft_query_matches(full_name,$search)

        """)

    mask = Field(
        StrVal(), default=None,
        doc="""
        HTSQL expression which is used to filter out records.

        It can reference context variables declared in the ``input`` field.
        """)

    sort = Field(
        RecordVal(('field', StrVal()), ('asc', BoolVal(), True)), default=undefined,
        doc="""
        Column for sorting
        """)

    input = Field(
        RecordTypeVal(), default=RecordType.empty(),
        doc="""
        Context requirements.

        It specifies a set of keys and their types which should be present in
        context for an action to be available.

        For example::

            - id: pick-individual
              type: ...
              input:
              - mother: individual
              - father: individual

        Specifies that action ``pick-individual`` is only available when context
        has keys ``mother`` and ``father`` of type ``individual``.
        """)


    def __init__(self, **values):
        super(Pick, self).__init__(**values)
        if self.fields is None and self.columns is not None:
            self.fields = self.reflect_fields(self.columns)

    def create_port(self):
        filters = []
        mask = []

        if self.search:
            filters.append('__search__($search) := %s' % self.search)

        if self.mask:
            mask.append(self.mask)

        if self.entity.type.state:
            mask.append(self.entity.type.state.expression)

        port = super(Pick, self).create_port(
            filters=filters,
            mask=expr_and(mask) if mask else None)
        return port

    def context(self):
        return self.input, RecordType([self.entity])


def expr_and(exprs):
    return ' & '.join('(%s)' % expr for expr in exprs)
