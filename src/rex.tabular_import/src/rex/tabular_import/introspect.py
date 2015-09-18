#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.db import get_db

from htsql.core.model import HomeNode, ColumnArc, ChainArc
from htsql.core.classify import classify


__all__ = (
    'get_table_description',
)


def get_table_node(table_name):
    with get_db():
        for label in classify(HomeNode()):
            if label.name == table_name:
                return label.target
    return None


def get_column_description(label, column):
    description = {
        'name': label.name,
        'type': {
            'name': unicode(column.domain.__class__),
        },
        'required': not (column.has_default or column.is_nullable),
        'unique': [
            [
                col.name
                for col in index.origin_columns
            ]
            for index in column.unique_keys
        ],
    }

    if hasattr(column.domain, 'labels'):
        description['type']['enumerations'] = column.domain.labels

    return description


def get_link_description(label, column):
    description = get_column_description(label, column)

    # TODO: drill down and get a format or name for the field type

    return description


def get_table_description(table_name):
    """
    Retrieves a description of the structure of the specified table, including
    the columns, their types, and their constraints.

    :param table_name: the name of the table to retrieve the description for
    :type table_name: str
    :rtype: dict
    """

    table_node = get_table_node(table_name)
    if not table_node:
        return None

    description = {
        'name': table_node.table.name,
        'columns': [],
    }

    with get_db():
        for label in classify(table_node):
            if isinstance(label.arc, ColumnArc):
                description['columns'].append(get_column_description(
                    label,
                    label.arc.column,
                ))

            elif isinstance(label.arc, ChainArc):
                if label.arc.is_reverse:
                    continue
                description['columns'].append(get_link_description(
                    label,
                    table_node.table.columns[
                        label.arc.joins[0].origin_columns[0].name
                    ],
                ))

    return description

