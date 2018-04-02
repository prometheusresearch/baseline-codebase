"""

    rex.action.actions.pick
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import IntVal, StrVal, SeqVal, MaybeVal, BoolVal, RecordVal, OneOfVal
from rex.port import Port
from rex.widget import Field, ColumnVal, undefined, formfield

from .. import typing
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
    js_type = 'rex-action', 'Pick'

    search = Field(
        StrVal(), default=None,
        doc="""
        HTSQL expression which is used to search for a term.

        For full text search ``ft_query_matches`` HTSQL function could be used::

            search: ft_query_matches(full_name,$search)

        """)

    search_placeholder = Field(
        StrVal(), default=undefined,
        doc="""
        Placeholder which is used for searchbox.
        """)

    mask = Field(
        StrVal(), default=None,
        doc="""
        HTSQL expression which is used to filter out records.

        It can reference context variables declared in the ``input`` field.
        """)

    sort_spec_val_single = RecordVal(('field', StrVal()), ('asc', BoolVal(), True))
    sort_spec_val = OneOfVal(sort_spec_val_single, SeqVal(sort_spec_val_single))

    sort = Field(
        sort_spec_val, default=undefined,
        doc="""
        Column for sorting
        """)

    input = Field(
        typing.RecordTypeVal(), default=typing.RecordType.empty(),
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

    refresh_interval = Field(
        IntVal(), default=undefined,
        doc="Refresh data periodically (interval is specified in seconds)")

    def create_port(self):
        filters = []
        mask = []

        if self.search:
            filters.append('__search__($search) := %s' % self.search)

        if self.mask:
            mask.append(self.mask)

        if self.entity.type.state:
            mask.append(self.entity.type.state.expression)

        fields = self.fields

        if self.sort:
            # check if user refers the previously defined field
            sort_defined = [f.expression
                              for f in fields
                              if isinstance(f, formfield.CalculatedFormField)
                              and '.'.join(f.value_key) == self.sort.field]
            sort_expression = sort_defined[0] \
                                if sort_defined else self.sort.field
            fields = fields + [
                formfield.CalculatedFormField(
                    value_key=['__sort__'],
                    expression=sort_expression,
                )
            ]

        port = super(Pick, self).create_port(
            fields=fields,
            filters=filters,
            mask=expr_and(mask) if mask else None)

        return port

    def context(self):
        return self.input, typing.RecordType([self.entity])


def expr_and(exprs):
    return ' & '.join('(%s)' % expr for expr in exprs)
