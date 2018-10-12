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
    Record(id='index', options={'indexes': [{'table': 'foo', 'columns': ['bar'], 'unique': False, 'partial': None}]})

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
    Record(id='index', options={'indexes': [{'table': 'foo', 'columns': ['bar', 'baz'], 'unique': False, 'partial': None}]})

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
    Record(id='index', options={'indexes': [{'table': 'foo', 'columns': ['bar', 'baz'], 'unique': False, 'partial': None}, {'table': 'blah', 'columns': ['col1'], 'unique': False, 'partial': 'col1 > 4'}]})


    >>> proc = {
    ...     'id': 'index',
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing Processor Option
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
    rex.core.Error: Missing Processor Option
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
    rex.core.Error: Expected a sequence
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
    'CREATE INDEX ON "foo"\n("bar");'

    >>> make_statement({
    ...     'table': 'foo',
    ...     'columns': ['bar', '"baz"'],
    ... })
    'CREATE INDEX ON "foo"\n("bar", "baz");'

    >>> make_statement({
    ...     'table': 'foo',
    ...     'columns': ['bar'],
    ...     'unique': True,
    ... })
    'CREATE UNIQUE INDEX ON "foo"\n("bar");'

    >>> make_statement({
    ...     'table': 'foo',
    ...     'columns': ['bar', 'baz'],
    ...     'partial': 'baz > 10',
    ... })
    'CREATE INDEX ON "foo"\n("bar", "baz") WHERE baz > 10;'

    >>> make_statement({
    ...     'table': 'foo',
    ...     'columns': ['bar', 'baz'],
    ...     'unique': True,
    ...     'partial': 'baz > 10',
    ... })
    'CREATE UNIQUE INDEX ON "foo"\n("bar", "baz") WHERE baz > 10;'



    >>> rex.off()

