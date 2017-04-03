#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.error import Error as HTSQLError
from htsql.core.domain import Profile, RecordDomain, UntypedDomain
from htsql.core.classify import classify
from htsql.core.cmd.embed import Embed
from htsql.tweak.etl.cmd.insert import (
        BuildExtractNode, BuildExtractTable,
        BuildExecuteInsert, BuildResolveIdentity)
from rex.db import get_db

from .error import TabularImportError
from .introspect import get_table_description
from .marshal import get_dataset


__all__ = (
    'import_tabular_data',
)


def insert(
        table,
        columns,
        values,
        query_cache,
        untyped=UntypedDomain()):
    row = []
    domains = []
    for value in values:
        if isinstance(value, unicode):
            row.append(value)
            domains.append(untyped)
        else:
            value = Embed.__invoke__(value)
            row.append(value.data)
            domains.append(value.domain)
    cache_key = (table, tuple(columns), tuple(domains))
    if cache_key not in query_cache:
        meta = Profile(
                RecordDomain([
                    Profile(domain, tag=column)
                    for domain, column in zip(domains, columns)]), tag=table)
        extract_node = BuildExtractNode.__invoke__(meta)
        extract_table = BuildExtractTable.__invoke__(
                extract_node.node,
                extract_node.arcs)
        execute_insert = BuildExecuteInsert.__invoke__(
                extract_table.table,
                extract_table.columns)
        resolve_identity = BuildResolveIdentity.__invoke__(
                execute_insert.table,
                execute_insert.output_columns,
                is_list=False)
        query = query_cache[cache_key] = (
                lambda values:
                    resolve_identity(
                    execute_insert(
                    extract_table(
                    extract_node(values)))))
    query = query_cache[cache_key]
    return query(row)


def import_tabular_data(
        table_name,
        file_content,
        file_format,
        use_defaults=False):
    """
    Imports a set of records from a flat file into a table.

    :param table_name: the name of the table to import the records into
    :type table_name: str
    :param file_content: the content of the file that contains the records
    :type file_content: str
    :param file_format:
        the file format the file that contains the records; see
        ``FILE_FORMATS`` for possible values
    :type file_format: str
    :param use_defaults:
        indicates whether or not the default values defined for non-primary key
        fields should be used when NULL values are received; if not specified,
        defaults to False
    :type use_defaults: bool
    :returns: the number of records that were imported into the table
    :raises:
        TabularImportError if there was a problem trying to import the records
    """

    # Get table info
    description = get_table_description(table_name)
    if not description:
        raise ValueError('No table named "%s" exists' % (table_name,))
    identity_fields = [
        col['name']
        for col in description['columns']
        if col['identity']
    ]

    # Parse the file
    data = get_dataset(file_content, file_format)

    # Make sure we've got the right set of columns
    description_headers = set([col['name'] for col in description['columns']])
    file_headers = set(data.headers)
    if len(file_headers) != len(data.headers):
        raise TabularImportError(
            'Incoming dataset has duplicate column headers'
        )
    extra = file_headers - description_headers
    if extra:
        raise TabularImportError(
            'Incoming dataset describes extra columns: %s' % (
                ', '.join(extra),
            )
        )
    missing = description_headers - file_headers
    if missing:
        raise TabularImportError(
            'Incoming dataset is missing columns: %s' % (
                ', '.join(missing),
            )
        )

    error = None
    db = get_db()
    query_cache = {}
    with db:
        with db.transaction() as db_connection:
            for row_idx, row in enumerate(data):
                col_names = []
                col_values = []
                for col_idx, col_name in enumerate(data.headers):
                    if row[col_idx] != '':
                        col_names.append(col_name)
                        col_values.append(row[col_idx])
                    else:
                        if use_defaults or col_name in identity_fields:
                            # Don't explicitly list the field in the insert,
                            # so that the database defaulting logic kicks in
                            continue
                        else:
                            # Otherwise, force it to NULL
                            col_names.append(col_name)
                            col_values.append(None)

                try:
                    insert(table_name, col_names, col_values, query_cache)
                except HTSQLError as exc:
                    if not error:
                        error = TabularImportError()
                    error.add_row_error(row, row_idx + 1, exc)

                    # Yes, the context manager will automatically do a rollback
                    # for us at the end of the loop, but we want to reset the
                    # database transaction so we can keep trying more rows to
                    # determine if other rows have problems, too.
                    db_connection.rollback()

            if error:
                db_connection.rollback()
                raise error

    return len(data)

