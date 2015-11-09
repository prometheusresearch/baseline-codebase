*********
Utilities
*********


extract_htsql_statements
========================

The ``extract_htsql_statements()`` function will return a list of individual
HTSQL statements that are embedded within a larger HTSQL script::

    >>> from rex.mart import extract_htsql_statements

    >>> extract_htsql_statements('')
    []

    >>> extract_htsql_statements('/foo')
    ['/foo']

    >>> extract_htsql_statements('/foo\n/bar')
    ['/foo', '/bar']

    >>> script = """
    ... # A comment
    ... /foo{
    ...         col1
    ...     }
    ...
    ... /bar
    ... """
    >>> extract_htsql_statements(script)
    ['/foo{\n        col1\n    }', '/bar']

    >>> script = """
    ...     /foo{
    ...         col1
    ...     }
    ...
    ... /bar
    ... """
    >>> extract_htsql_statements(script)
    Traceback (most recent call last):
        ...
    Error: Got unexpected indentation, line 2


guarded
=======

The ``guarded()`` context manager will coerce any exceptions raised in its
block into a rex.core.Error and then wrap it with the specified message and
payload::

    >>> from rex.core import Error
    >>> from rex.mart import guarded

    >>> with guarded('This is my message'):
    ...     raise Error('oh no!')
    Traceback (most recent call last):
        ...
    Error: oh no!
    This is my message

    >>> with guarded('This is my message', 'some context'):
    ...     raise Error('oh no!')
    Traceback (most recent call last):
        ...
    Error: oh no!
    This is my message
        some context

    >>> with guarded('This is my message'):
    ...     raise Exception('Not a Rex Error!')
    Traceback (most recent call last):
        ...
    Error: Not a Rex Error!
    This is my message

    >>> with guarded('This is my message', 'some context'):
    ...     raise Exception('Not a Rex Error!')
    Traceback (most recent call last):
        ...
    Error: Not a Rex Error!
    This is my message
        some context

    >>> with guarded('Nothing happens'):
    ...     print "All's well"
    All's well

