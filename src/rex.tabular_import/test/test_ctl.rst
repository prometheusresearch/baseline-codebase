****************
REX.CTL Commands
****************


Set up the environment::

    >>> from rex.ctl import ctl


tabular-import-template
=======================

The ``tabular-import-template`` command will create an import template file for
the specified table::

    >>> ctl('help tabular-import-template')
    TABULAR-IMPORT-TEMPLATE - creates a template file that can be used with the tabular-import task
    Usage: rex tabular-import-template [<project>] <table>
    <BLANKLINE>
    The tabular-import-template task will create a template file that contains
    a skeleton structure and field information about the table you wish to
    import data into.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the template in; can be CSV, TSV, XLS; if not specified, defaults to CSV
    <BLANKLINE>

    >>> ctl('tabular-import-template --project=rex.tabular_import_demo all_column_types')
    integer_field,boolean_field,decimal_field,float_field,text_field,date_field,time_field,datetime_field,json_field,enum_field
    Primary Key; Required (Has Default); Integer,"Required; One of: true, false",Required; Decimal,Required; Float,Required; Text,Required; Date (YYYY-MM-DD),Required; Time (HH:MM:SS),Required; Date&Time (YYYY-MM-DD HH:MM:SS),Required; json,"Required; One of: foo, bar, baz"

Specifying a non-existant table will cause an error::

    >>> ctl('tabular-import-template --project=rex.tabular_import_demo doesntexist', expect=1)
    FATAL ERROR: No table named "doesntexist" exists
    <BLANKLINE>

Different file formats can be specified::

    >>> ctl('tabular-import-template --project=rex.tabular_import_demo all_column_types --format=tsv')  # doctest: +NORMALIZE_WHITESPACE
    integer_field	boolean_field	decimal_field	float_field	text_field	date_field	time_field	datetime_field	json_field	enum_field
    Primary Key; Required (Has Default); Integer	Required; One of: true, false	Required; Decimal	Required; Float	Required; Text	Required; Date (YYYY-MM-DD)	Required; Time (HH:MM:SS)	Required; Date&Time (YYYY-MM-DD HH:MM:SS)	Required; json	Required; One of: foo, bar, baz

Invalid file formats cause an error::

    >>> ctl('tabular-import-template --project=rex.tabular_import_demo all_column_types --format=pdf', expect=1)
    FATAL ERROR: invalid value for option --format: Invalid format type "PDF" specified
    <BLANKLINE>


tabular-import
==============

The ``tabular-import`` command will load records from a flat file into a table
in the database::

    >>> ctl('help tabular-import')
    TABULAR-IMPORT - loads records from a flat file into a table in the database
    Usage: rex tabular-import [<project>] <table> <data>
    <BLANKLINE>
    The tabular-import task will take the records described in a flat file
    (generally one based on a template from the tabular-import-template task)
    and load them into the specified table.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --format=FORMAT          : the format that the data file is in; if not specified, CSV is assumed
      --use-defaults           : whether or not the default values defined for non-primary key fields should be used when null columns are received; by default, this is disabled
    <BLANKLINE>

    >>> ctl('tabular-import --project=rex.tabular_import_demo all_column_types ./demo/static/data/all_column_types.csv')
    1 records imported into all_column_types

If you specify a non-existant table, it will cause an error::

    >>> ctl('tabular-import --project=rex.tabular_import_demo doesntexist ./demo/static/data/all_column_types.csv', expect=1)
    FATAL ERROR: No table named "doesntexist" exists
    <BLANKLINE>

If you specify a non-existant file, it will cause an error::

    >>> ctl('tabular-import --project=rex.tabular_import_demo all_column_types ./demo/static/data/doesntexist.csv', expect=1)
    FATAL ERROR: Could not open "./demo/static/data/doesntexist.csv" for reading: [Errno 2] No such file or directory: './demo/static/data/doesntexist.csv'
    <BLANKLINE>

If there are records with problems, messages are printed describing those
problems::

    >>> ctl('tabular-import --project=rex.tabular_import_demo all_column_types ./demo/static/data/all_column_types_badformats.csv', expect=1)
    FATAL ERROR: Errors occurred while importing the records
        2: Failed to adapt value of enum_field to enum('foo', 'bar', 'baz'): 'blah'
        3: Failed to adapt value of json_field to json: '{'
        4: Failed to adapt value of datetime_field to datetime: '1980-05-22 noon'
        5: Failed to adapt value of time_field to time: 'noon'
        6: Failed to adapt value of date_field to date: 'May the Twenty-Second'
        7: Failed to adapt value of float_field to float: 'float'
        8: Failed to adapt value of decimal_field to decimal: 'decimal'
        9: Failed to adapt value of boolean_field to boolean: 'happy'
        10: Failed to adapt value of integer_field to integer: 'integer'
    <BLANKLINE>

