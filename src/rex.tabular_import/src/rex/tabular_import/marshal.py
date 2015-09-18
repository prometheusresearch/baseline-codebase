#
# Copyright (c) 2015, Prometheus Research, LLC
#


from tablib import Dataset


__all__ = (
    'FILE_FORMATS',
    'FILE_FORMAT_CSV',
    'FILE_FORMAT_ODS',
    'FILE_FORMAT_TSV',
    'FILE_FORMAT_XLS',
    'FILE_FORMAT_XLSX',
    'make_template',
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
}


def make_column_description(column):
    parts = []

    if column['required']:
        parts.append('Required')

    if column['unique']:
        for constraint in column['unique']:
            if len(constraint) == 1:
                parts.append('Unique')
            else:
                other_fields = list(constraint)
                if column['name'] in other_fields:
                    other_fields.remove(column['name'])
                parts.append(
                    'Unique with: %s' % (
                        ', '.join(other_fields),
                    )
                )

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

#: OpenDocument Spreadsheet format
FILE_FORMAT_ODS = 'ODS'

#: Legacy Excel format
FILE_FORMAT_XLS = 'XLS'

#: Excel 2007+ format
FILE_FORMAT_XLSX = 'XLSX'

#: All supported file format codes
FILE_FORMATS = (
    FILE_FORMAT_CSV,
    FILE_FORMAT_TSV,
    FILE_FORMAT_ODS,
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
    elif file_format == FILE_FORMAT_ODS:
        return data.ods
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

