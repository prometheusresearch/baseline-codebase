************************
datadictionary Processor
************************


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()


Validation
==========

This processor accepts a variety of options::

    >>> from rex.mart import ProcessorVal
    >>> val = ProcessorVal()

    >>> proc = {
    ...     'id': 'datadictionary',
    ... }
    >>> val(proc)
    Record(id='datadictionary', options={'table_name_tables': 'datadictionary_table', 'table_name_columns': 'datadictionary_column', 'table_name_enumerations': 'datadictionary_enumeration', 'table_descriptions': None, 'column_descriptions': None, 'enumeration_descriptions': None})

    >>> proc = {
    ...     'id': 'datadictionary',
    ...     'options': {
    ...         'table_name_tables': 'foo',
    ...     },
    ... }
    >>> val(proc)
    Record(id='datadictionary', options={'table_name_tables': 'foo', 'table_name_columns': 'datadictionary_column', 'table_name_enumerations': 'datadictionary_enumeration', 'table_descriptions': None, 'column_descriptions': None, 'enumeration_descriptions': None})

    >>> proc = {
    ...     'id': 'datadictionary',
    ...     'options': {
    ...         'table_descriptions': 'name,title,description\ntable,Title,Description\n',
    ...     },
    ... }
    >>> val(proc)
    Record(id='datadictionary', options={'table_name_tables': 'datadictionary_table', 'table_name_columns': 'datadictionary_column', 'table_name_enumerations': 'datadictionary_enumeration', 'table_descriptions': 'name,title,description\ntable,Title,Description', 'column_descriptions': None, 'enumeration_descriptions': None})

    >>> proc = {
    ...     'id': 'datadictionary',
    ...     'options': {
    ...         'table_descriptions': 'title,description\nTitle,Description\n',
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing required field "name"
    While validating field:
        table_descriptions
    While validating field:
        options

    >>> proc = {
    ...     'id': 'datadictionary',
    ...     'options': {
    ...         'table_descriptions': 123,
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a string
    Got:
        123
    While validating field:
        table_descriptions
    While validating field:
        options

    >>> proc = {
    ...     'id': 'datadictionary',
    ...     'options': {
    ...         'table_descriptions': 'name,title\rfoo,bar',
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    rex.core.Error: Invalid CSV input: new-line character seen in unquoted field - do you need to open the file in universal-newline mode?
    While validating field:
        table_descriptions
    While validating field:
        options

    >>> proc = {
    ...     'id': 'datadictionary',
    ...     'options': {
    ...         'column_descriptions': 'name,description\nfoo,bar',
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing required field "table"
    While validating field:
        column_descriptions
    While validating field:
        options

    >>> proc = {
    ...     'id': 'datadictionary',
    ...     'options': {
    ...         'enumeration_descriptions': 'table,column,name\nfoo,bar,baz',
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing required field "description"
    While validating field:
        enumeration_descriptions
    While validating field:
        options



    >>> rex.off()

