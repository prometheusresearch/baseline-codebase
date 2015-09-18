***********
Marshalling
***********


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.tabular_import_demo')
    >>> rexWithDeploy = Rex('rex.tabular_import_demo', htsql_extensions={'rex_deploy': {}})
    >>> from rex.tabular_import.introspect import get_table_description
    >>> from rex.tabular_import.marshal import *
    >>> from pprint import pprint


make_template
=============

The make_template() function will generate the contents of a template file
based on the table description it receives and the file format that is
specified::

    >>> with rexWithDeploy:
    ...     description = get_table_description('all_column_types')

    >>> make_template(description, FILE_FORMAT_CSV)
    'integer_field,boolean_field,decimal_field,float_field,text_field,date_field,time_field,datetime_field,json_field,enum_field\r\nRequired; Unique; Integer,"Required; One of: true, false",Required; Decimal,Required; Float,Required; Text,Required; Date (YYYY-MM-DD),Required; Time (HH:MM:SS),Required; Date&Time (YYYY-MM-DD HH:MM:SS),Required; json,"Required; One of: foo, bar, baz"\r\n'

    >>> make_template(description, FILE_FORMAT_TSV)
    'integer_field\tboolean_field\tdecimal_field\tfloat_field\ttext_field\tdate_field\ttime_field\tdatetime_field\tjson_field\tenum_field\r\nRequired; Unique; Integer\tRequired; One of: true, false\tRequired; Decimal\tRequired; Float\tRequired; Text\tRequired; Date (YYYY-MM-DD)\tRequired; Time (HH:MM:SS)\tRequired; Date&Time (YYYY-MM-DD HH:MM:SS)\tRequired; json\tRequired; One of: foo, bar, baz\r\n'

The following file formats are binary, so we can't really output them here::

    >>> make_template(description, FILE_FORMAT_ODS) is None
    False

    >>> make_template(description, FILE_FORMAT_XLS) is None
    False

    >>> make_template(description, FILE_FORMAT_XLSX) is None
    False

If you request a bogus file type, you get an exception::

    >>> make_template(description, 'PDF')
    Traceback (most recent call last):
        ...
    ValueError: "PDF" is not a supported template file format

