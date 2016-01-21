***************
index Processor
***************


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()


Validation
==========

This processor accepts just one option, ``indexes``::

    >>> from rex.mart import ProcessorVal
    >>> val = ProcessorVal()

    >>> proc = {
    ...     'id': 'index',
    ...     'options': {
    ...         'indexes': [
    ...             {
    ...                 'table': 'foo',
    ...                 'columns': 'bar',
    ...             },
    ...         ],
    ...     },
    ... }
    >>> val(proc)
    Record(id='index', options={'indexes': [{'table': 'foo', 'unique': False, 'partial': None, 'columns': ['bar']}]})

    >>> proc = {
    ...     'id': 'index',
    ...     'options': {
    ...         'indexes': [
    ...             {
    ...                 'table': 'foo',
    ...                 'columns': ['bar', 'baz'],
    ...             },
    ...         ],
    ...     },
    ... }
    >>> val(proc)
    Record(id='index', options={'indexes': [{'table': 'foo', 'unique': False, 'partial': None, 'columns': ['bar', 'baz']}]})

    >>> proc = {
    ...     'id': 'index',
    ...     'options': {
    ...         'indexes': [
    ...             {
    ...                 'table': 'foo',
    ...                 'columns': ['bar', 'baz'],
    ...             },
    ...             {
    ...                 'table': 'blah',
    ...                 'columns': 'col1',
    ...                 'partial': 'col1 > 4',
    ...             },
    ...         ],
    ...     },
    ... }
    >>> val(proc)
    Record(id='index', options={'indexes': [{'table': 'foo', 'unique': False, 'partial': None, 'columns': ['bar', 'baz']}, {'table': 'blah', 'unique': False, 'partial': 'col1 > 4', 'columns': ['col1']}]})


    >>> proc = {
    ...     'id': 'index',
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    Error: Missing Processor Option
        indexes
    While validating field:
        options

    >>> proc = {
    ...     'id': 'index',
    ...     'options': {
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    Error: Missing Processor Option
        indexes
    While validating field:
        options

    >>> proc = {
    ...     'id': 'index',
    ...     'options': {
    ...         'indexes': None,
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    Error: Expected a sequence
    Got:
        None
    While validating field:
        indexes
    While validating field:
        options


Index Creation Statements
=========================

This processor essentially translates the configuration stanzas into CREATE
INDEX statements and executes them::

    >>> from rex.mart.processors.index import make_statement

    >>> make_statement({
    ...     'table': 'foo',
    ...     'columns': ['bar'],
    ... })
    u'CREATE INDEX ON "foo" ("bar");'

    >>> make_statement({
    ...     'table': 'foo',
    ...     'columns': ['bar', '"baz"'],
    ... })
    u'CREATE INDEX ON "foo" ("bar", "baz");'

    >>> make_statement({
    ...     'table': 'foo',
    ...     'columns': ['bar'],
    ...     'unique': True,
    ... })
    u'CREATE UNIQUE INDEX ON "foo" ("bar");'

    >>> make_statement({
    ...     'table': 'foo',
    ...     'columns': ['bar', 'baz'],
    ...     'partial': 'baz > 10',
    ... })
    u'CREATE INDEX ON "foo" ("bar", "baz") WHERE baz > 10;'

    >>> make_statement({
    ...     'table': 'foo',
    ...     'columns': ['bar', 'baz'],
    ...     'unique': True,
    ...     'partial': 'baz > 10',
    ... })
    u'CREATE UNIQUE INDEX ON "foo" ("bar", "baz") WHERE baz > 10;'





    >>> rex.off()

