#
# Copyright (c) 2015, Prometheus Research, LLC
#


from tablib import Dataset, detect, formats, InvalidDimensions

from rex.core import Error


__all__ = (
    'FILE_FORMATS',
    'FILE_FORMAT_CSV',
    'FILE_FORMAT_TSV',
    'FILE_FORMAT_XLS',
    'FILE_FORMAT_XLSX',
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

#: Excel 2007+ format
FILE_FORMAT_XLSX = 'XLSX'

#: All supported file format codes
FILE_FORMATS = (
    FILE_FORMAT_CSV,
    FILE_FORMAT_TSV,
    FILE_FORMAT_XLS,
    FILE_FORMAT_XLSX,
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
        return data.csv
    elif file_format == FILE_FORMAT_TSV:
        return data.tsv
    elif file_format == FILE_FORMAT_XLS:
        return data.xls
    elif file_format == FILE_FORMAT_XLSX:
        return data.xlsx
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
    FILE_FORMAT_XLSX: formats.xlsx,
}


def get_dataset(stream, file_format=None):
    """
    Parses a stream into a Dataset.

    :param stream: the File-like object that contains the data
    :type stream: file
    :param file_format:
        the format of the data in the stream; if None, or not specified, this
        function will attempt to automatically detect the format
    :type file_format: string
    :rtype: Dataset
    """

    raw_data = stream.read()

    if not file_format:
        format_impl, _ = detect(raw_data)
    else:
        format_impl = FILE_FORMAT_IMPLEMENTATIONS.get(file_format)
    if not format_impl:
        raise Error('Could not identify the file format of the data stream')

    data = Dataset()
    try:
        format_impl.import_set(data, raw_data)
    except InvalidDimensions:
        raise Error(
            'Row #%s as an incorrect number of columns' % (
                len(data) + 1,
            )
        )
    return data

