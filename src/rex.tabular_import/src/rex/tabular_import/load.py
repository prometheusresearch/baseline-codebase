#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.error import Error as HTSQLError
from rex.db import get_db

from .error import TabularImportError
from .introspect import get_table_description
from .marshal import get_dataset


__all__ = (
    'import_tabular_data',
)


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
    with db:
        with db.transaction() as db_connection:
            for row_idx, row in enumerate(data):
                col_values = {}
                for col_idx, col_name in enumerate(data.headers):
                    if row[col_idx] != '':
                        col_values[col_name] = row[col_idx]
                    else:
                        if use_defaults or col_name in identity_fields:
                            # Don't explicitly list the field in the insert,
                            # so that the database defaulting logic kicks in
                            continue
                        else:
                            # Otherwise, force it to NULL
                            col_values[col_name] = None

                htsql = '{%s} :as %s/:insert' % (
                    ', '.join([
                        '$%s :as %s' % (k, k)
                        for k in col_values.keys()
                    ]),
                    description['name'],
                )

                try:
                    db.produce(htsql, **col_values)
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
                raise error

    return len(data)

