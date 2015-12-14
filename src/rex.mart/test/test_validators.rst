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


ParentalRelationshipVal
=======================

ParentalRelationshipVal validates the ``parental_relationship`` of Asssessment
Definitions::

    >>> from rex.mart import ParentalRelationshipVal
    >>> val = ParentalRelationshipVal()

    >>> val({'type': 'trunk'})
    Record(type='trunk', parent=[])

    >>> val({'type': 'facet', 'parent': 'foo'})
    Record(type='facet', parent=['foo'])

    >>> val({'type': 'branch', 'parent': 'foo'})
    Record(type='branch', parent=['foo'])

    >>> val({'type': 'facet', 'parent': ['foo']})
    Record(type='facet', parent=['foo'])

    >>> val({'type': 'branch', 'parent': ['foo']})
    Record(type='branch', parent=['foo'])

    >>> val({'type': 'cross', 'parent': ['foo', 'bar']})
    Record(type='cross', parent=['foo', 'bar'])

    >>> val({'type': 'ternary', 'parent': ['foo', 'bar']})
    Record(type='ternary', parent=['foo', 'bar'])

    >>> val({'type': 'trunk', 'parent': 'foo'})
    Traceback (most recent call last):
        ...
    Error: Relationship type "trunk" cannot have any parents
    Got:
        ['foo']
    While validating field:
        parent

    >>> val({'type': 'facet'})
    Traceback (most recent call last):
        ...
    Error: Relationship type "facet" must have exactly one parent
    Got:
        []
    While validating field:
        parent

    >>> val({'type': 'facet', 'parent': ['foo', 'bar']})
    Traceback (most recent call last):
        ...
    Error: Relationship type "facet" must have exactly one parent
    Got:
        ['foo', 'bar']
    While validating field:
        parent

    >>> val({'type': 'branch'})
    Traceback (most recent call last):
        ...
    Error: Relationship type "branch" must have exactly one parent
    Got:
        []
    While validating field:
        parent

    >>> val({'type': 'branch', 'parent': ['foo', 'bar']})
    Traceback (most recent call last):
        ...
    Error: Relationship type "branch" must have exactly one parent
    Got:
        ['foo', 'bar']
    While validating field:
        parent

    >>> val({'type': 'cross'})
    Traceback (most recent call last):
        ...
    Error: Relationship type "cross" must have at least two parents
    Got:
        []
    While validating field:
        parent

    >>> val({'type': 'cross', 'parent': 'foo'})
    Traceback (most recent call last):
        ...
    Error: Relationship type "cross" must have at least two parents
    Got:
        ['foo']
    While validating field:
        parent

    >>> val({'type': 'ternary'})
    Traceback (most recent call last):
        ...
    Error: Relationship type "ternary" must have at least two parents
    Got:
        []
    While validating field:
        parent

    >>> val({'type': 'ternary', 'parent': 'foo'})
    Traceback (most recent call last):
        ...
    Error: Relationship type "ternary" must have at least two parents
    Got:
        ['foo']
    While validating field:
        parent


AssessmentDefinitionVal
=======================

AssessmentDefinitionVal validates a single Assessment Definition::

    >>> from rex.mart import AssessmentDefinitionVal
    >>> val = AssessmentDefinitionVal()

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'name': 'bar',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name='bar', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': '0FoO',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ... }
    >>> val(assessment)
    Record(instrument=['0FoO'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'parental_relationship': {
    ...         'type': 'facet',
    ...         'parent': 'footable',
    ...     },
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='facet', parent=['footable']), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'identifiable': 'none',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='none', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'fields': None,
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=None, calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'fields': 'bar',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=['bar'], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'fields': [
    ...         'bar',
    ...         'baz',
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=['bar', 'baz'], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'calculations': None,
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=None, meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'calculations': 'bar',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=['bar'], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'calculations': [
    ...         'bar',
    ...         'baz',
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=['bar', 'baz'], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': 'bar',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'bar': 'text'}], post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': [
    ...         'bar',
    ...         'baz',
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'bar': 'text'}, {'baz': 'text'}], post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': [
    ...         'bar',
    ...         {'baz': 'boolean'},
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'bar': 'text'}, {'baz': 'boolean'}], post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': {'bar': 'boolean'},
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'bar': 'boolean'}], post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': 'timeTaken',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'timeTaken': 'integer'}], post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'post_load_calculations': {
    ...         'name': 'postcalc1',
    ...         'type': 'text',
    ...         'expression': 'upper(assessment_uid)',
    ...     },
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[Record(name='postcalc1', type='text', expression='upper(assessment_uid)')])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'post_load_calculations': [
    ...         {'name': 'postcalc1', 'type': 'text', 'expression': 'upper(assessment_uid)'},
    ...         {'name': 'postcalc2', 'type': 'text', 'expression': 'upper(assessment_uid)'},
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[Record(name='postcalc1', type='text', expression='upper(assessment_uid)'), Record(name='postcalc2', type='text', expression='upper(assessment_uid)')])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'post_load_calculations': {
    ...         'name': 'postcalc1',
    ...         'type': 'something',
    ...         'expression': 'upper(assessment_uid)',
    ...     },
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Expected one of:
        text, integer, float, boolean, date, time, dateTime
    Got:
        'something'
    While validating field:
        type
    While validating field:
        post_load_calculations

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'post_load_calculations': [
    ...         {'name': 'postcalc1', 'type': 'text', 'expression': 'upper(assessment_uid)'},
    ...         {'name': 'postcalc1', 'type': 'text', 'expression': 'upper(assessment_uid)'},
    ...     ],
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Calculation Names (postcalc1) cannot be duplicated within an Assessment
    While validating field:
        post_load_calculations

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': [
    ...         'calculations',
    ...     ],
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: CalculationSet results are handled by the calculations property
    While validating sequence item
        #1
    While validating field:
        meta

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': [
    ...         {'application': 'boolean'},
    ...     ],
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Cannot redefine the standard type for "application"
    While validating sequence item
        #1
    While validating field:
        meta

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': {'bar': 'boolean', 'baz': 'text'},
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Mapping can only contain one element
    While validating field:
        meta

    >>> assessment = {
    ...     'instrument': 'foo',
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        selector

    >>> assessment = {
    ...     'selector': '/measure{id() :as assessment_uid}',
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        instrument

    >>> assessment = {
    ...     'instrument': '1234567890',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Cannot make a safe token out of "1234567890"
    While validating field:
        name

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'parental_relationship': 'trunk',
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Expected a JSON object
    Got:
        'trunk'
    While validating field:
        parental_relationship

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'fields': None,
    ...     'calculations': None,
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Definition does not include any fields, calculations, or metadata


DefinitionVal
=============

DefinitionVal validates a single Mart Definition::

    >>> from rex.mart import DefinitionVal
    >>> val = DefinitionVal()

    >>> definition = {
    ...     'id': 'foo'
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], assessments=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'label': '',
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], assessments=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'label': 'My Label',
    ... }
    >>> val(definition)
    Record(id='foo', label='My Label', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], assessments=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'description': 'This is a database'
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description='This is a database', base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], assessments=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'base': {
    ...         'type': 'fresh',
    ...     },
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], assessments=[], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'base': {
    ...         'type': 'fresh',
    ...         'name_token': 'custom_token_',
    ...     },
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='custom_token_'), deploy=None, post_deploy_scripts=[], assessments=[], post_assessment_scripts=[])

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
    Record(id='foo', label='foo', description=None, base=Record(type='copy', target='bar', name_token='foo_'), deploy=[{'table': 'my_table', 'with': [{'column': 'my_column', 'type': 'text'}]}], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[])

    >>> definition = "{id: foo, base: {type: copy, target: bar}, deploy: [{table: my_table, with: [{column: my_column, type: text}]}]}"
    >>> val.parse(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='copy', target='bar', name_token='foo_'), deploy=[{'table': 'my_table', 'with': [{'column': 'my_column', 'type': 'text'}]}], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[])

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
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[Record(script='/blah/:merge', type='htsql', parameters={}), Record(script='/foo/:insert', type='htsql', parameters={})], assessments=[], post_assessment_scripts=[])

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
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], assessments=[], post_assessment_scripts=[Record(script='/foo/:insert', type='htsql', parameters={})])

    >>> definition = {
    ...     'id': 'foo',
    ...     'assessments': [
    ...         {
    ...             'instrument': 'foo',
    ...             'selector': '/measure{id() :as assessment_uid}',
    ...         },
    ...     ],
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], assessments=[Record(instrument=['foo'], name=u'foo', selector='/measure{id() :as assessment_uid}', parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])], post_assessment_scripts=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'assessments': [
    ...         {
    ...             'instrument': 'foo',
    ...             'selector': '/measure{id() :as assessment_uid}',
    ...         },
    ...         {
    ...             'instrument': 'blah',
    ...             'name': 'foo',
    ...             'selector': '/measure{id() :as assessment_uid}',
    ...         },
    ...     ],
    ... }
    >>> val(definition)
    Traceback (most recent call last):
        ...
    Error: Assessment Names (foo) cannot be duplicated within a Definition
    While validating field:
        assessments


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
    Record(definitions=[Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='foo_'), deploy=None, post_deploy_scripts=[], assessments=[], post_assessment_scripts=[]), Record(id='bar', label='bar', description=None, base=Record(type='fresh', target=None, name_token='bar_'), deploy=None, post_deploy_scripts=[], assessments=[], post_assessment_scripts=[])])

    >>> val({'definitions': [{'id': 'foo'}, {'id': 'foo'}]})
    Traceback (most recent call last):
        ...
    Error: Definition IDs (foo) cannot be duplicated within a collection

    >>> val({'definitions': [{'id': 'foo', 'base': {'type': 'existing', 'target': 'my_target'}}, {'id': 'bar', 'base': {'type': 'existing', 'target': 'my_target'}}]})
    Traceback (most recent call last):
        ...
    Error: Multiple definitions attempt to write to the same existing database(s): my_target


RunListEntryVal
===============

RunListEntryVal will validate a single RunList entry::

    >>> from rex.mart import RunListEntryVal
    >>> val = RunListEntryVal()

    >>> val({'owner': 'test', 'definition': 'some_def'})
    Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False)

    >>> val({'owner': 'test', 'definition': 'some_def', 'halt_on_failure': True})
    Record(owner='test', definition='some_def', halt_on_failure=True, purge_on_failure=True, leave_incomplete=False)

    >>> val({'owner': 'test', 'definition': 'some_def', 'purge_on_failure': False})
    Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=False, leave_incomplete=False)

    >>> val({'owner': 'test', 'definition': 'some_def', 'leave_incomplete': True})
    Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=True, leave_incomplete=True)

    >>> val({'owner': 'test'})
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        definition

    >>> val({'definition': 'some_def'})
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        owner


RunListVal
==========

RunListVal will validate the entire contents of a RunList file::

    >>> from rex.mart import RunListVal
    >>> val = RunListVal()

    >>> val([])
    []

    >>> val([{'owner': 'test', 'definition': 'some_def'}])
    [Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False)]

    >>> val([{'owner': 'test', 'definition': 'some_def'}, {'owner': 'someoneelse', 'definition': 'other'}])
    [Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False), Record(owner='someoneelse', definition='other', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False)]

