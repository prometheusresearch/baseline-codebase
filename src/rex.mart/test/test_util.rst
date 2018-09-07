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
    rex.core.Error: Got unexpected indentation, line 2


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
    rex.core.Error: oh no!
    This is my message

    >>> with guarded('This is my message', 'some context'):
    ...     raise Error('oh no!')
    Traceback (most recent call last):
        ...
    rex.core.Error: oh no!
    This is my message
        some context

    >>> with guarded('This is my message'):
    ...     raise Exception('Not a Rex Error!')
    Traceback (most recent call last):
        ...
    rex.core.Error: Not a Rex Error!
    This is my message

    >>> with guarded('This is my message', 'some context'):
    ...     raise Exception('Not a Rex Error!')
    Traceback (most recent call last):
        ...
    rex.core.Error: Not a Rex Error!
    This is my message
        some context

    >>> with guarded('Nothing happens'):
    ...     print("All's well")
    All's well


make_safe_token
===============

Massages the given string so that it is safe for use as the name of an object
in the database::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()

    >>> from rex.mart import make_safe_token

    >>> make_safe_token('foo')
    'foo'

    >>> make_safe_token('FOO')
    'foo'

    >>> make_safe_token('foo-bar')
    'foo_bar'

    >>> make_safe_token('fOo-Bar#baZ')
    'foo_barbaz'

    >>> make_safe_token('fOo-B@r#baZ')
    'foo_brbaz'

    >>> make_safe_token('qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm')
    'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopa'

    >>> make_safe_token('id')
    'id_'

    >>> make_safe_token('%^$#%&^%&*&')
    Traceback (most recent call last):
        ...
    rex.core.Error: Cannot make a safe token out of "%^$#%&^%&*&"



    >>> rex.off()


