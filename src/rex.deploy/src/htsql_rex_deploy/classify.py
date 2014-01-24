#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.deploy import TableMeta, ColumnMeta
from htsql.core.cache import once
from htsql.core.entity import TableEntity, ColumnEntity
from htsql.core.classify import CallTable, CallColumn, CallChain
from .introspect import get_image


@once
def get_meta(entity):
    # Returns rex.deploy metadata for an HTSQL entity object.
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


class DeployCallTable(CallTable):
    # Generates a suitable label for a table.

    def __call__(self):
        table = self.arc.table
        meta = get_meta(table)
        label = meta.label or table.name
        yield label, 1


class DeployCallColumn(CallColumn):
    # Generates a label for a column.

    def __call__(self):
        column = self.arc.column
        if not (column.name == u'id' or column.foreign_keys):
            meta = get_meta(column)
            label = meta.label or column.name
            yield label, 1


class DeployCallChain(CallChain):
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
            elif link_column.name.endswith(u'_id'):
                link_label = link_column.name[:-2].rstrip(u'_')

        if is_direct and link_label:
            yield link_label, 4
        if is_primary:
            yield target_label, 3
        else:
            yield target_label, 2
        if not is_direct and link_label:
            label = u"%s %s %s" % (target_label, self.path_word, link_label)
            yield label, 1


