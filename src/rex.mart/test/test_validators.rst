**********
Validators
**********


MartBaseVal
===========

MartBaseVal validates the ``base`` of Mart Definitions::

    >>> from rex.mart import MartBaseVal
    >>> val = MartBaseVal()

    >>> val({'type': 'fresh'})
    Record(type='fresh', target=None, name_token=None)

    >>> val({'type': 'copy', 'target': 'foo'})
    Record(type='copy', target='foo', name_token=None)

    >>> val({'type': 'existing', 'target': 'bar'})
    Record(type='existing', target='bar', name_token=None)

    >>> val({'type': 'fresh', 'name_token': 'foo'})
    Record(type='fresh', target=None, name_token='foo')

    >>> val({'type': 'fresh', 'target': 'baz'})
    Traceback (most recent call last):
        ...
    Error: Bases type "fresh" cannot have target database names
    Got:
        'baz'
    While validating field:
        target

    >>> val({'type': 'copy'})
    Traceback (most recent call last):
        ...
    Error: Base type of "copy" requires a target database name
    Got:
        None
    While validating field:
        target

    >>> val({'type': 'existing'})
    Traceback (most recent call last):
        ...
    Error: Base type of "existing" requires a target database name
    Got:
        None
    While validating field:
        target

    >>> val({'type': 'something'})
    Traceback (most recent call last):
        ...
    Error: Expected one of:
        fresh, copy, existing
    Got:
        'something'
    While validating field:
        type

    >>> val({'type': 'existing', 'target': 'bar', 'name_token': 'foo'})
    Traceback (most recent call last):
        ...
    Error: Base type "existing" cannot have a name token
    Got:
        'foo'
    While validating field:
        name_token


EtlScriptVal
============

EtlScriptVal validates script entries in Mart Definitions::

    >>> from rex.mart import EtlScriptVal
    >>> val = EtlScriptVal()

    >>> val({'script': '/foo', 'type': 'htsql'})
    Record(script='/foo', type='htsql', parameters={})

    >>> val({'script': 'delete from foo', 'type': 'sql'})
    Record(script='delete from foo', type='sql', parameters={})

    >>> val({'type': 'htsql'})
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        script

    >>> val({'script': '', 'type': 'htsql'})
    Traceback (most recent call last):
        ...
    Error: ETL Scripts cannot be empty
    Got:
        ''
    While validating field:
        script

    >>> val({'script': None, 'type': 'htsql'})
    Traceback (most recent call last):
        ...
    Error: Expected a string
    Got:
        None
    While validating field:
        script

    >>> val({'script': 'del foo', 'type': 'python'})
    Traceback (most recent call last):
        ...
    Error: Expected one of:
        htsql, sql
    Got:
        'python'
    While validating field:
        type

    >>> val({'script': '/foo', 'type': ''})
    Traceback (most recent call last):
        ...
    Error: Expected one of:
        htsql, sql
    Got:
        ''
    While validating field:
        type

    >>> val({'script': '/foo', 'type': None})
    Traceback (most recent call last):
        ...
    Error: Expected a string
    Got:
        None
    While validating field:
        type

    >>> val({'script': '/foo'})
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        type

    >>> val({'script': '/foo', 'type': 'htsql', 'parameters': {'foo': 'bar'}})
    Record(script='/foo', type='htsql', parameters={'foo': 'bar'})

    >>> val({'script': '/foo', 'type': 'htsql', 'parameters': {'foo': 'bar', 'baz': None}})
    Record(script='/foo', type='htsql', parameters={'foo': 'bar', 'baz': None})

    >>> val({'script': '/foo', 'type': 'htsql', 'parameters': 'foo'})
    Traceback (most recent call last):
        ...
    Error: Expected a JSON object
    Got:
        'foo'
    While validating field:
        parameters


DefinitionVal
=============

DefinitionVal validates a single Mart Definition::

    >>> from rex.mart import DefinitionVal
    >>> val = DefinitionVal()

    >>> definition = {
    ...     'id': 'foo'
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'label': '',
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'label': 'My Label',
    ... }
    >>> val(definition)
    Record(id='foo', label='My Label', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'description': 'This is a database'
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description='This is a database', base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'base': {
    ...         'type': 'fresh',
    ...     },
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'base': {
    ...         'type': 'fresh',
    ...         'name_token': 'custom_token_',
    ...     },
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='custom_token_'), deploy=None, post_deploy_scripts=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'base': {
    ...         'type': 'copy',
    ...         'target': 'bar',
    ...     },
    ...     'deploy': [
    ...         {
    ...             'table': 'my_table',
    ...             'with': [
    ...                 {
    ...                     'column': 'my_column',
    ...                     'type': 'text',
    ...                 }
    ...             ],
    ...         },
    ...     ],
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='copy', target='bar', name_token='foo_'), deploy=[{'table': 'my_table', 'with': [{'column': 'my_column', 'type': 'text'}]}], post_deploy_scripts=[], post_assessment_scripts=[])

    >>> definition = "{id: foo, base: {type: copy, target: bar}, deploy: [{table: my_table, with: [{column: my_column, type: text}]}]}"
    >>> val.parse(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='copy', target='bar', name_token='foo_'), deploy=[{'table': 'my_table', 'with': [{'column': 'my_column', 'type': 'text'}]}], post_deploy_scripts=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'base': {
    ...         'type': 'copy',
    ...         'target': 'bar',
    ...     },
    ...     'deploy': [
    ...         {
    ...             'table': 'my_table',
    ...             'with': 'broken',
    ...         },
    ...     ],
    ... }
    >>> val(definition)
    Traceback (most recent call last):
        ...
    Error: Expected a JSON array
    Got:
        'broken'
    While validating field:
        with
    While validating sequence item
        #1
    While validating field:
        deploy

    >>> definition = {
    ...     'id': 'foo',
    ...     'post_deploy_scripts': [
    ...         {
    ...             'script': '/blah/:merge',
    ...             'type': 'htsql',
    ...         },
    ...         {
    ...             'script': '/foo/:insert',
    ...             'type': 'htsql',
    ...         },
    ...     ],
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[Record(script='/blah/:merge', type='htsql', parameters={}), Record(script='/foo/:insert', type='htsql', parameters={})], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'post_assessment_scripts': [
    ...         {
    ...             'script': '/foo/:insert',
    ...             'type': 'htsql',
    ...         },
    ...     ],
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], post_assessment_scripts=[Record(script='/foo/:insert', type='htsql', parameters={})])


MartConfigurationVal
====================

MartConfigurationVal will validate the contents of an entire ``mart.yaml``::

    >>> from rex.mart import MartConfigurationVal
    >>> val = MartConfigurationVal()

    >>> val({})
    Record(definitions=[])

    >>> val({'definitions': []})
    Record(definitions=[])

    >>> val({'definitions': [{'id': 'foo'}, {'id': 'bar'}]})
    Record(definitions=[Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], post_assessment_scripts=[]), Record(id='bar', label='bar', description=None, base=Record(type='fresh', target=None, name_token='bar_'), deploy=None, post_deploy_scripts=[], post_assessment_scripts=[])])

    >>> val({'definitions': [{'id': 'foo'}, {'id': 'foo'}]})
    Traceback (most recent call last):
        ...
    Error: Definition IDs (foo) cannot be duplicated within a collection

    >>> val({'definitions': [{'id': 'foo', 'base': {'type': 'existing', 'target': 'my_target'}}, {'id': 'bar', 'base': {'type': 'existing', 'target': 'my_target'}}]})
    Traceback (most recent call last):
        ...
    Error: Multiple definitions attempt to write to the same existing database(s): my_target

