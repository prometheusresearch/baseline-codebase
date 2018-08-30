#
# Copyright (c) 2014, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.tr.lookup import lookup, Lookup, GuessHeaderProbe, IdentityProbe
from htsql.core.tr.binding import TableBinding, ColumnBinding, ChainBinding
from ..classify import get_meta


class SelectIdentityProbe(IdentityProbe):
    pass


class SelectIdentityForTable(Lookup):

    adapt(TableBinding, SelectIdentityProbe)

    def __call__(self):
        if isinstance(self.binding, ChainBinding):
            return super(SelectIdentityForTable, self).__call__()
        return None


class SelectIdentityForChain(Lookup):

    adapt(ChainBinding, SelectIdentityProbe)

    def __call__(self):
        if self.binding.joins[-1].is_reverse:
            return None
        return super(SelectIdentityForChain, self).__call__()


class GuessHeaderForTable(Lookup):
    # Generates tabular header for a table.

    adapt(TableBinding, GuessHeaderProbe)

    def __call__(self):
        from rex.deploy import label_to_title
        table = self.binding.table
        meta = get_meta(table)
        if meta.title is not None:
            return meta.title
        if meta.label is not None:
            return label_to_title(meta.label)
        return label_to_title(table.name)


class GuessHeaderForColumn(Lookup):
    # Generates a tabular header for a column.

    adapt(ColumnBinding, GuessHeaderProbe)

    def __call__(self):
        from rex.deploy import label_to_title
        column = self.binding.column
        meta = get_meta(column)
        if meta.title is not None:
            return meta.title
        if meta.label is not None:
            return label_to_title(meta.label)
        return label_to_title(column.name)


class GuessHeaderForChain(Lookup):
    # Generates a tabular header for a link.

    adapt(ChainBinding, GuessHeaderProbe)

    def __call__(self):
        from rex.deploy import label_to_title
        target_table = self.binding.joins[-1].target
        target_meta = get_meta(target_table)
        target_label = target_meta.label or target_table.name
        if len(self.binding.joins) == 1:
            join = self.binding.joins[0]
            if join.is_direct and len(join.origin_columns) == 1:
                column = join.origin_columns[0]
                meta = get_meta(column)
                if meta.title is not None:
                    return meta.title
                label = meta.label
                if label is None:
                    label = column.name
                    if label.endswith('_id'):
                        label = label[:-2].rstrip('_')
                if label != target_label:
                    return label_to_title(label)
        # FIXME: for reverse links, use the target title only when the
        # link label coincides with the target table label.
        return target_meta.title or label_to_title(target_label)


def select_identity(binding):
    return lookup(binding, SelectIdentityProbe())


