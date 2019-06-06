"""

    rex.graphql.reflect
    ===================

    Reflect database schema into GraphQL schema.

    :copyright: 2019-present Prometheus Research, LLC

"""

from cached_property import cached_property
from rex.db import get_db
from htsql.core.tr.lookup import prescribe, unwrap
from htsql.core.tr.bind import BindingState
from htsql.core.tr.binding import (
    RootBinding,
    LocateBinding,
    ClipBinding,
    SelectionBinding,
    TableBinding,
)
from htsql.core.syn.syntax import VoidSyntax
from htsql.core import domain
from htsql.core.model import (
    HomeNode,
    DomainNode,
    TableArc,
    ChainArc,
    ColumnArc,
    SyntaxArc,
    InvalidArc,
)
from htsql.core.classify import classify, localize, relabel

from . import desc, introspection, model, model_scalar, schema
from .query import query as q


def type_from_domain(dom: domain.Domain):
    if isinstance(dom, domain.BooleanDomain):
        return desc.scalar.Boolean
    elif isinstance(dom, domain.FloatDomain):
        return desc.scalar.Float
    elif isinstance(dom, domain.IntegerDomain):
        return desc.scalar.Int
    elif isinstance(dom, domain.TextDomain):
        return desc.scalar.String
    elif isinstance(dom, domain.DateDomain):
        return desc.scalar.Date
    elif isinstance(dom, domain.DateTimeDomain):
        return desc.scalar.Datetime
    elif isinstance(dom, domain.DecimalDomain):
        return desc.scalar.Decimal
    else:
        # TODO: support enums!
        return None


eq_domain_types = {
    domain.TextDomain,
    domain.FloatDomain,
    domain.IntegerDomain,
    domain.DateDomain,
    domain.DateTimeDomain,
    domain.DecimalDomain,
    domain.EnumDomain,
}

range_domain_types = {
    domain.FloatDomain,
    domain.IntegerDomain,
    domain.DateDomain,
    domain.DateTimeDomain,
    domain.DecimalDomain,
}


class EqFilter(desc.Filter):
    def __init__(self, arg, query):
        self.arg = arg
        self.query = query

    @property
    def args(self):
        return {self.arg.name: self.arg}

    def apply(self, query, values):
        if self.arg.name not in values:
            return query
        v = values[self.arg.name]
        return query.filter(self.query == v)


class reflect:
    def __init__(
        self,
        db=None,
        include_tables=None,
        exclude_tables=None,
        disable_filter_reflecton=False,
    ):
        self.types = {}
        self.fields = {}
        self._extra_fields = {}
        self._db = db
        self.include_tables = include_tables
        self.exclude_tables = exclude_tables
        self.disable_filter_reflecton = disable_filter_reflecton

        with self.db:
            self._reflect()

    @cached_property
    def db(self):
        return self._db if self._db is not None else get_db()

    def is_table_allowed(self, table):
        if self.include_tables is not None:
            if table.name not in self.include_tables:
                return False
        if self.exclude_tables is not None:
            if table.name in self.exclude_tables:
                return False
        return True

    def _reflect_fields(self, arc):
        def fields():
            # Binding state is going to be used to type SyntaxArc.
            state = BindingState(RootBinding(VoidSyntax()))
            recipe = prescribe(arc, state.scope)
            table_binding = state.use(recipe, state.scope.syntax)
            state.push_scope(table_binding)

            fields = {}
            for label in classify(arc.target):
                query = q.navigate(label.name)
                if isinstance(label.arc, ColumnArc):
                    fields[label.name] = desc.query(query, loc=None)
                elif isinstance(label.arc, SyntaxArc):

                    # Probe the kind of output
                    probe = state.bind(label.arc.syntax)
                    while isinstance(probe, (LocateBinding, ClipBinding)):
                        probe = probe.seed
                    selection_binding = unwrap(
                        probe, SelectionBinding, is_deep=True
                    )
                    table_binding = unwrap(probe, TableBinding, is_deep=True)

                    fieldtype = None
                    if selection_binding is not None:
                        # This will be handled by rex.graphql.model code later
                        # and raise an error.
                        pass
                    elif table_binding is not None:
                        fieldtype = self.types[table_binding.table.name]
                    else:
                        # This is likely a column, the type will be inferred by
                        # rex.graphql.model later.
                        pass

                    fields[label.name] = desc.query(
                        query, type=fieldtype, loc=None
                    )
                elif isinstance(label.arc, (TableArc, ChainArc)):
                    table = label.target.table
                    if not self.is_table_allowed(table):
                        continue
                    fieldtype = self.types[table.name]
                    fields[f"{label.name}"] = desc.query(
                        query, type=fieldtype, loc=None
                    )
                elif isinstance(label.arc, InvalidArc):
                    continue
                else:
                    # TODO: Print a warning instead?
                    continue
            return fields

        return fields

    def _collect_filters(self, query, fieldtype, node):
        for label in classify(node):
            if not isinstance(label.target, DomainNode):
                continue
            domain_type = type(label.target.domain)
            arg_type = type_from_domain(label.target.domain)
            arg_query = q.navigate(label.name)
            if not arg_type:
                continue
            if domain_type in eq_domain_types:
                # Add "column__eq" filter
                arg = desc.argument(
                    f"{label.name}__eq",
                    desc.List(arg_type),
                    loc=None,
                    description=f"Filter by {label.name} being equal to",
                )
                yield EqFilter(arg, arg_query)

            if domain_type in range_domain_types:
                # Add "column__lt" filter
                arg = desc.argument(
                    f"{label.name}__lt",
                    arg_type,
                    loc=None,
                    description=f"Filter by {label.name} being less than to",
                )
                yield arg_query < arg
                # Add "column__le" filter
                arg = desc.argument(
                    f"{label.name}__le",
                    arg_type,
                    description=f"Filter by {label.name} being less than or equal to",
                )
                yield arg_query <= arg
                # Add "column__gt" filter
                arg = desc.argument(
                    f"{label.name}__gt",
                    arg_type,
                    description=f"Filter by {label.name} being greater than to",
                )
                yield arg_query > arg
                # Add "column__ge" filter
                arg = desc.argument(
                    f"{label.name}__ge",
                    arg_type,
                    description=f"Filter by {label.name} being greater than or equal to",
                )
                yield arg_query >= arg

    def _create_all_connection(self, query, fieldtype, node):
        filters = (
            list(
                self._collect_filters(
                    query=query, fieldtype=fieldtype, node=node
                )
            )
            if not self.disable_filter_reflecton
            else []
        )
        return desc.query(
            query=query, type=fieldtype, filters=filters, loc=None
        )

    def _create_paginated_connection(self, query, fieldtype, node):
        filters = (
            list(
                self._collect_filters(
                    query=query, fieldtype=fieldtype, node=node
                )
            )
            if not self.disable_filter_reflecton
            else []
        )
        return desc.query(
            query=query,
            type=fieldtype,
            filters=filters,
            paginate=True,
            loc=None,
        )

    def _reflect(self):
        for label in classify(HomeNode()):
            if not isinstance(label.arc, TableArc):
                continue
            table = label.target.table

            if not self.is_table_allowed(table):
                continue

            entitytype = desc.Entity(
                name=label.name,
                fields=self._reflect_fields(label.arc),
                loc=None,
            )
            self.types[table.name] = entitytype

            query = q.navigate(label.name)

            self.fields[f"{label.name}"] = desc.query(
                query.filter(
                    q.id.text() == desc.argument("id", desc.scalar.ID)
                ).first(),
                type=entitytype,
                loc=None,
            )

            self.fields[f"{label.name}__all"] = self._create_all_connection(
                query=query, fieldtype=entitytype, node=label.target
            )

            self.fields[
                f"{label.name}__paginated"
            ] = self._create_paginated_connection(
                query=query, fieldtype=entitytype, node=label.target
            )

    def add_field(self, name, field):
        self._extra_fields[name] = field

    def to_schema(self):
        fields = lambda: {**self.fields, **self._extra_fields}
        return schema(fields=fields, db=self.db, loc=None)
