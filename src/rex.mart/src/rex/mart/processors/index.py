#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import StrVal, BoolVal, SeqVal, MaybeVal
from rex.deploy.sql import sql_template

from ..connections import get_sql_connection
from ..util import guarded
from ..validators import FullyValidatingRecordVal, NormalizedOneOrSeqVal
from .base import Processor


__all__ = (
    'IndexProcessor',
)


class IndexVal(FullyValidatingRecordVal):
    def __init__(self):
        super(IndexVal, self).__init__(
            ('table', StrVal),

            ('columns', NormalizedOneOrSeqVal(StrVal)),

            ('unique', BoolVal, False),

            ('partial', MaybeVal(StrVal), None),
        )


# pylint: disable=unused-argument
@sql_template
def sql_create_index(
        table,
        columns,
        unique=False,
        where=None):  # pragma: no cover
    """
    CREATE {%- if unique %} UNIQUE{% endif %} INDEX ON {{ table }}
    ({{ columns }}) {%- if where %} WHERE {{ where }}{% endif %};
    """


def quote(value):
    if value.startswith('"') and value.endswith('"'):
        return value
    return '"%s"' % (value.replace("\"", "\"\""),)


def make_statement(index):
    table = quote(index['table'])
    columns = ', '.join([
        col if col.startswith('(') and col.endswith(')') else quote(col)
        for col in index['columns']
    ])
    return sql_create_index(
        table,
        columns,
        unique=index.get('unique', False),
        where=index.get('partial'),
    )


class IndexProcessor(Processor):
    """
    Creates the specified set of indexes in the Mart database.

    This Processors accepts the following options:

    ``indexes``
        This is a list of index definitions, where each definition is a mapping
        that accepts the following properties:

        ``table``
            The name of the table to apply the index to. This property is
            required.

        ``columns``
            A list of the column(s) and/or expressions on the table to apply
            the index to. Expressions must be enclosed in parentheses. This
            property is required.

        ``unique``
            A boolean indicating whether or not to enforce uniqueness on the
            values in the index. Defaults to ``false``.

        ``partial``
            This property contains the predicate of the WHERE clause to use if
            you want the index to be partial. Defaults to ``null`` (meaning
            that the index will NOT be partial).
    """

    #:
    name = 'index'

    options = (
        ('indexes', SeqVal(IndexVal)),
    )

    def execute(self, options, interface):
        for idx, index in enumerate(options['indexes']):
            idx_label = '#%s' % (idx + 1,)
            with guarded('While creating index:', idx_label):
                with get_sql_connection(interface.get_htsql()) as sql:
                    cursor = sql.cursor()
                    try:
                        statement = make_statement(index)
                        cursor.execute(statement)
                    finally:
                        cursor.close()

        interface.log('Created %s indexes' % (len(options['indexes']),))

