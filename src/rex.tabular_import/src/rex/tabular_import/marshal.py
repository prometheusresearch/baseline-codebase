#
# Copyright (c) 2015, Prometheus Research, LLC
#


from tablib import Dataset, formats, InvalidDimensions

from .error import TabularImportError


__all__ = (
    'FILE_FORMATS',
    'FILE_FORMAT_CSV',
    'FILE_FORMAT_TSV',
    'FILE_FORMAT_XLS',
    'make_template',
    'get_dataset',
)


COLUMN_TYPE_DESCRIPTORS = {
    'boolean': lambda desc: 'One of: true, false',
    'integer': lambda desc: 'Integer',
    'decimal': lambda desc: 'Decimal',
    'float': lambda desc: 'Float',
    'text': lambda desc: 'Text',
    'date': lambda desc: 'Date (YYYY-MM-DD)',
    'time': lambda desc: 'Time (HH:MM:SS)',
    'datetime': lambda desc: 'Date&Time (YYYY-MM-DD HH:MM:SS)',
    'enum': lambda desc: 'One of: %s' % (', '.join(desc['enumerations']),),
    'link': lambda desc: 'An Identifier from the %s table' % (desc['target'],)
}


def make_column_description(column):
    parts = []

    if column['identity']:
        parts.append('Primary Key')
    if column['required']:
        if column['default']:
            parts.append('Required (Has Default)')
        else:
            parts.append('Required')
    elif column['default']:
        parts.append('Has Default Value')
    if column['unique']:
        parts.append('Unique')

    if column['type']['name'] in COLUMN_TYPE_DESCRIPTORS:
        parts.append(
            COLUMN_TYPE_DESCRIPTORS[column['type']['name']](
                column['type'],
            )
        )
    else:
        parts.append(column['type']['name'])

    return '; '.join(parts)


def make_table_description_dataset(description):
    data = Dataset()
    data.title = description['name']

    data.append([
        col['name']
        for col in description['columns']
    ])

    data.append([
        make_column_description(col)
        for col in description['columns']
    ])

    return data


#: Comma-separated file format
FILE_FORMAT_CSV = 'CSV'

#: Tab-separated file format
FILE_FORMAT_TSV = 'TSV'

#: Legacy Excel format
FILE_FORMAT_XLS = 'XLS'

#: All supported file format codes
FILE_FORMATS = (
    FILE_FORMAT_CSV,
    FILE_FORMAT_TSV,
    FILE_FORMAT_XLS,
)


def make_template(description, file_format):
    """
    Creates an import template based on the specified table description.

    :param description:
        the table description you wish to create a template for, as returned
        from the ``get_table_description()`` function
    :type description: dict
    :param file_format:
        the file format the template should be created in; see ``FILE_FORMATS``
        for possible values
    :type file_format: str
    :returns: the contents of the template file
    """

    data = make_table_description_dataset(description)

    if file_format == FILE_FORMAT_CSV:
        return data.csv.strip().replace('\r\n', '\n')
    elif file_format == FILE_FORMAT_TSV:
        return data.tsv.strip().replace('\r\n', '\n')
    elif file_format == FILE_FORMAT_XLS:
        return data.xls
    else:
        raise ValueError(
            '"%s" is not a supported template file format' % (
                file_format,
            )
        )


FILE_FORMAT_IMPLEMENTATIONS = {
    FILE_FORMAT_CSV: formats.csv,
    FILE_FORMAT_TSV: formats.tsv,
    FILE_FORMAT_XLS: formats.xls,
}


def get_dataset(file_content, file_format):
    """
    Parses a file's content into a Dataset.

    :param file_content: the content of the file that contains the data
    :type file_content: str
    :param file_format:
        the format of the data; see ``FILE_FORMATS`` for possible values
    :type file_format: str
    :rtype: Dataset
    """

    format_impl = FILE_FORMAT_IMPLEMENTATIONS.get(file_format)
    if not format_impl:
        raise ValueError(
            '"%s" is not a supported file format' % (
                file_format,
            )
        )

    if file_format in (FILE_FORMAT_CSV, FILE_FORMAT_TSV):
        # Strip blank lines at the end so we don't have to deal with
        # empty records.
        file_content = file_content.rstrip('\r\n')

    data = Dataset()
    try:
        format_impl.import_set(data, file_content)
    except InvalidDimensions:
        error = TabularImportError()
        error.add_row_error(
            None,
            len(data) + 1,
            'Incorrect number of columns',
        )
        raise error
    return data

