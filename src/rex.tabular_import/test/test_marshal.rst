***********
Marshalling
***********


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.tabular_import_demo')
    >>> from rex.tabular_import.introspect import get_table_description
    >>> from rex.tabular_import.marshal import *
    >>> from pprint import pprint


make_template
=============

The make_template() function will generate the contents of a template file
based on the table description it receives and the file format that is
specified::

    >>> with rex:
    ...     description = get_table_description('all_column_types')

    >>> make_template(description, FILE_FORMAT_CSV)
    'integer_field,boolean_field,decimal_field,float_field,text_field,date_field,time_field,datetime_field,json_field,enum_field\nPrimary Key; Required (Has Default); Integer,"Required; One of: true, false",Required; Decimal,Required; Float,Required; Text,Required; Date (YYYY-MM-DD),Required; Time (HH:MM:SS),Required; Date&Time (YYYY-MM-DD HH:MM:SS),Required; json,"Required; One of: foo, bar, baz"'

    >>> make_template(description, FILE_FORMAT_TSV)
    'integer_field\tboolean_field\tdecimal_field\tfloat_field\ttext_field\tdate_field\ttime_field\tdatetime_field\tjson_field\tenum_field\nPrimary Key; Required (Has Default); Integer\tRequired; One of: true, false\tRequired; Decimal\tRequired; Float\tRequired; Text\tRequired; Date (YYYY-MM-DD)\tRequired; Time (HH:MM:SS)\tRequired; Date&Time (YYYY-MM-DD HH:MM:SS)\tRequired; json\tRequired; One of: foo, bar, baz'

The following file formats are binary, so we can't really output them here::

    >>> make_template(description, FILE_FORMAT_XLS) is None
    False

If you request a bogus file type, you get an exception::

    >>> make_template(description, 'PDF')
    Traceback (most recent call last):
        ...
    ValueError: "PDF" is not a supported template file format

It can generate templates for tables of all shapes and sizes::

    >>> with rex:
    ...     make_template(get_table_description('required_tests'), FILE_FORMAT_CSV)
    'code,is_required,not_required,is_required_with_default,not_required_with_default\nPrimary Key; Required (Has Default); Integer,Required; Text,Text,Required (Has Default); Text,Has Default Value; Text'

    >>> with rex:
    ...     make_template(get_table_description('unique_tests'), FILE_FORMAT_CSV)
    'code,is_unique,not_unique\nPrimary Key; Required (Has Default); Integer,Required; Unique; Text,Required; Text'

    >>> with rex:
    ...     make_template(get_table_description('trunk'), FILE_FORMAT_CSV)
    'code,a_field\nPrimary Key; Required (Has Default); Integer,Required; Text'

    >>> with rex:
    ...     make_template(get_table_description('branch'), FILE_FORMAT_CSV)
    'trunk,code,some_field\nPrimary Key; Required; An Identifier from the trunk table,Primary Key; Required (Has Default); Integer,"Required; One of: true, false"'

    >>> with rex:
    ...     make_template(get_table_description('facet'), FILE_FORMAT_CSV)
    'trunk,another_field\nPrimary Key; Required; An Identifier from the trunk table,Required; Float'

    >>> with rex:
    ...     make_template(get_table_description('another_trunk'), FILE_FORMAT_CSV)
    'code,some_data\nPrimary Key; Required (Has Default); Integer,Required; Text'

    >>> with rex:
    ...     make_template(get_table_description('cross'), FILE_FORMAT_CSV)
    'trunk,another_trunk,a_number\nPrimary Key; Required; An Identifier from the trunk table,Primary Key; Required; An Identifier from the another_trunk table,Required; Float'

    >>> with rex:
    ...     make_template(get_table_description('ternary'), FILE_FORMAT_CSV)
    'trunk,another_trunk,code,a_number\nPrimary Key; Required; An Identifier from the trunk table,Primary Key; Required; An Identifier from the another_trunk table,Primary Key; Required (Has Default); Integer,Required; Float'

