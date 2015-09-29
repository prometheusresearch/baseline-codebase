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
        mask = None

        if self.search:
            filters.append('__search__($search) := %s' % self.search)

        if self.mask:
            if self.input.rows:
                mask_args = ', '.join('$%s' % k for k in self.input.rows.keys())
                filters.append('__mask__(%s) := %s' % (mask_args, self.mask))
            else:
                mask = self.mask

        if self.entity.type.state:
            filters.append('__state__($_) := %s' % self.entity.type.state.expression)

        return super(Pick, self).create_port(filters=filters, mask=mask)

    def bind_port(self):
        bindings = {}
        if self.search:
            bindings['*:__search__'] = dataspec.StateBinding('search')
        if self.mask and self.input.rows:
            bindings['*:__mask__'] = ContextBinding(self.input.rows.keys(), is_join=False)
        if self.entity.type.state:
            bindings['*:__state__'] = '_'
        if self.sort:
            bindings['*.%s:sort' % self.sort.field] = 'asc' if self.sort.asc else 'desc'
        return bindings

    def context(self):
        return self.input, RecordType([self.entity])
