#
# Copyright (c) 2014, Prometheus Research, LLC
#


from htsql.core.cache import once
from htsql.core.entity import TableEntity, ColumnEntity
from htsql.core.model import ColumnArc, ChainArc
from htsql.core.model import SyntaxArc, TableNode
from htsql.core.classify import (
        TraceTable, CallTable, CallColumn, CallChain, CallSyntax, OrderTable)
from .introspect import get_image


@once
def get_meta(entity):
    # Returns rex.deploy metadata for an HTSQL entity object.
    from rex.deploy import TableMeta, ColumnMeta
    catalog_image = get_image()
    if isinstance(entity, TableEntity):
        schema_image = catalog_image[entity.schema.name]
        table_image = schema_image[entity.name]
        return TableMeta.parse(table_image)
    elif isinstance(entity, ColumnEntity):
        table_entity = entity.table
        schema_image = catalog_image[table_entity.schema.name]
        table_image = schema_image[table_entity.name]
        column_image = table_image[entity.name]
        return ColumnMeta.parse(column_image)
    else:
        raise NotImplementedError(repr(entity))


@once
def get_syntax_arcs(node):
    syntax_arcs = {}
    meta = get_meta(node.table)
    for spec in meta.aliases:
        label = spec.label
        parameters = None
        if spec.parameters is not None:
            parameters = [(name, True) for name in spec.parameters]
        arity = -1 if parameters is None else len(parameters)
        syntax = spec.body
        arc = SyntaxArc(node, parameters, syntax)
        syntax_arcs[label, arity] = arc
    return syntax_arcs


class DominateOverride:

    @classmethod
    def __dominates__(component, other):
        return (issubclass(component, other) or
                other.__module__.startswith('htsql.tweak.override.'))


class DeployTraceTable(DominateOverride, TraceTable):

    def __call__(self):
        for arc in super(DeployTraceTable, self).__call__():
            yield arc
        syntax_arcs = get_syntax_arcs(self.node)
        for key in sorted(syntax_arcs):
            yield syntax_arcs[key]


class DeployCallTable(DominateOverride, CallTable):
    # Generates a suitable label for a table.

    def __call__(self):
        table = self.arc.table
        meta = get_meta(table)
        label = meta.label or table.name
        yield label, 1


class DeployCallColumn(DominateOverride, CallColumn):
    # Generates a label for a column.

    def __call__(self):
        column = self.arc.column
        if not (column.name == 'id' or column.foreign_keys):
            meta = get_meta(column)
            label = meta.label or column.name
            yield label, 1


class DeployCallChain(DominateOverride, CallChain):
    # Generates a label for a link.

    def __call__(self):
        is_primary = True
        for join in self.arc.joins:
            foreign_key = join.foreign_key
            primary_key = foreign_key.origin.primary_key
            if primary_key is None:
                is_primary = False
                break
            if not all(column in primary_key.origin_columns
                       for column in foreign_key.origin_columns):
                is_primary = False
                break

        is_direct = all(join.is_direct for join in self.arc.joins)

        target_table = self.arc.target.table
        target_meta = get_meta(target_table)
        target_label = target_meta.label or target_table.name
        link_label = None
        if len(self.arc.joins) == 1:
            foreign_key = join.foreign_key
            link_column = foreign_key.origin_columns[-1]
            link_meta = get_meta(link_column)
            if link_meta.label:
                link_label = link_meta.label
            elif link_column.name.endswith('_id'):
                link_label = link_column.name[:-2].rstrip('_')

        if is_direct and link_label:
            yield link_label, 4
        if is_primary:
            yield target_label, 3
        else:
            yield target_label, 2
        if not is_direct and link_label:
            label = "%s %s %s" % (target_label, self.path_word, link_label)
            yield label, 1


class DeployCallSyntax(DominateOverride, CallSyntax):

    def __call__(self):
        if isinstance(self.arc.origin, TableNode):
            syntax_arcs = get_syntax_arcs(self.arc.origin)
            for key in sorted(syntax_arcs):
                if syntax_arcs[key] is self.arc:
                    name, arity = key
                    yield name, 5
        for name, weight in super(DeployCallSyntax, self).__call__():
            yield name, weight


class OrderTableWithLinks(DominateOverride, OrderTable):

    def __call__(self):
        order = {}
        for idx, column in enumerate(self.node.table.columns):
            order[column] = idx
        max_order = len(self.node.table.columns)
        labels = []
        for label in self.labels:
            if isinstance(label.arc, ColumnArc):
                label = label.clone(is_public=True)
                order[label] = order.get(label.arc.column, max_order)
            elif isinstance(label.arc, ChainArc) and label.arc.is_direct:
                label = label.clone(is_public=True)
                column = label.arc.joins[0].origin_columns[0]
                order[label] = order.get(column, max_order)
            else:
                order[label] = max_order
            labels.append(label)
        labels.sort(key=(lambda l: order[l]))
        return labels


