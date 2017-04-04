**********
Validators
**********


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()


MartBaseVal
===========

MartBaseVal validates the ``base`` of Mart Definitions::

    >>> from rex.mart import MartBaseVal
    >>> val = MartBaseVal()

    >>> val({'type': 'fresh'})
    Record(type='fresh', target=None, name_token=None, fixed_name=None)

    >>> val({'type': 'copy', 'target': 'foo'})
    Record(type='copy', target='foo', name_token=None, fixed_name=None)

    >>> val({'type': 'application'})
    Record(type='application', target=None, name_token=None, fixed_name=None)

    >>> val({'type': 'existing', 'target': 'bar'})
    Record(type='existing', target='bar', name_token=None, fixed_name=None)

    >>> val({'type': 'fresh', 'name_token': 'foo'})
    Record(type='fresh', target=None, name_token='foo', fixed_name=None)

    >>> val({'type': 'fresh', 'fixed_name': 'foo'})
    Record(type='fresh', target=None, name_token=None, fixed_name='foo')

    >>> val({'type': 'fresh', 'target': 'baz'})
    Traceback (most recent call last):
        ...
    Error: Bases type "fresh" cannot have target database names
    Got:
        'baz'
    While validating field:
        target

    >>> val({'type': 'application', 'target': 'baz'})
    Traceback (most recent call last):
        ...
    Error: Bases type "application" cannot have target database names
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
        fresh, copy, existing, application
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

    >>> val({'type': 'existing', 'target': 'bar', 'fixed_name': 'foo'})
    Traceback (most recent call last):
        ...
    Error: Base type "existing" cannot have a fixed name
    Got:
        'foo'
    While validating field:
        fixed_name

    >>> val({'type': 'fresh', 'fixed_name': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm'})
    Traceback (most recent call last):
        ...
    Error: Fixed name cannot be longer than 63 characters
    Got:
        'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm'
    While validating field:
        fixed_name

ParameterVal
============

ParameterVal validates parameter entries in Mart Definitions::

    >>> from rex.mart import ParameterVal
    >>> val = ParameterVal()

    >>> val({'name': 'foo', 'type': 'text'})
    Record(name='foo', type='text', default=REQUIRED)

    >>> val({'name': 'foo', 'type': 'text', 'default': 'bar'})
    Record(name='foo', type='text', default='bar')

    >>> val({'name': 'foo', 'type': 'text', 'default': None})
    Record(name='foo', type='text', default=None)

    >>> val({'name': '123', 'type': 'text'})
    Traceback (most recent call last):
        ...
    Error: Expected a string matching:
        /[a-zA-Z][a-zA-Z0-9_]*/
    Got:
        '123'
    While validating field:
        name

    >>> val({'name': 'foo', 'type': 'enumeration'})
    Traceback (most recent call last):
        ...
    Error: Expected one of:
        text, integer, float, boolean, date, time, dateTime
    Got:
        'enumeration'
    While validating field:
        type

    >>> val({'name': 'foo', 'type': 'integer', 'default': 'bar'})
    Traceback (most recent call last):
        ...
    Error: Expected an integer
    Got:
        'bar'
    While validating field:
        default


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
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': ['foo', 'bar'],
    ...     'selector': '/measure{id() :as assessment_uid}',
    ... }
    >>> val(assessment)
    Record(instrument=['foo', 'bar'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': '@ALL',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ... }
    >>> val(assessment)
    Record(instrument='@ALL', name=None, selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'name': 'bar',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name='bar', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': '0FoO',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ... }
    >>> val(assessment)
    Record(instrument=['0FoO'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': {
    ...         'query': '/measure{id() :as assessment_uid}',
    ...     },
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': {
    ...         'query': '/measure{id() :as assessment_uid}',
    ...         'parameters': {
    ...             'mood': 'happy',
    ...         },
    ...     },
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={'mood': 'happy'}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'parental_relationship': {
    ...         'type': 'facet',
    ...         'parent': 'footable',
    ...     },
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='facet', parent=['footable']), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'identifiable': 'none',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='none', fields=[], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'fields': None,
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=None, calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'fields': 'bar',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=['bar'], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'fields': [
    ...         'bar',
    ...         'baz',
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=['bar', 'baz'], calculations=[], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'calculations': None,
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=None, meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'calculations': 'bar',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=['bar'], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'calculations': [
    ...         'bar',
    ...         'baz',
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=['bar', 'baz'], meta=None, post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': 'bar',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'bar': 'text'}], post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': [
    ...         'bar',
    ...         'baz',
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'bar': 'text'}, {'baz': 'text'}], post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': [
    ...         'bar',
    ...         {'baz': 'boolean'},
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'bar': 'text'}, {'baz': 'boolean'}], post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': {'bar': 'boolean'},
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'bar': 'boolean'}], post_load_calculations=[])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'meta': 'timeTaken',
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=[{'timeTaken': 'integer'}], post_load_calculations=[])

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
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[Record(name='postcalc1', type='text', expression='upper(assessment_uid)')])

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'post_load_calculations': [
    ...         {'name': 'postcalc1', 'type': 'text', 'expression': 'upper(assessment_uid)'},
    ...         {'name': 'postcalc2', 'type': 'text', 'expression': 'upper(assessment_uid)'},
    ...     ],
    ... }
    >>> val(assessment)
    Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[Record(name='postcalc1', type='text', expression='upper(assessment_uid)'), Record(name='postcalc2', type='text', expression='upper(assessment_uid)')])

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
    ...     'selector': '   ',
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Selector querys cannot be empty
    Got:
        ''
    While validating field:
        query
    While validating field:
        selector

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': 123,
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Failed to match the value against any of the following:
        Expected a string
        Got:
            123
    <BLANKLINE>
        Expected a mapping
        Got:
            123
    While validating field:
        selector

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': {
    ...         'parameters': {
    ...             'mood': 'happy',
    ...         },
    ...     },
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Failed to match the value against any of the following:
        Expected a string
        Got:
            {'parameters': {'mood': 'happy'}}
    <BLANKLINE>
        Missing mandatory field:
            query
    While validating field:
        selector

    >>> assessment = {
    ...     'instrument': 'foo',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'name': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: Name cannot be longer than 60 characters
    Got:
        qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm
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

    >>> assessment = {
    ...     'instrument': '@ALL',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'name': 'something',
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: The "name", "fields", "calculations", and "post_load_calculations" properties are not allowed when @ALL is specified for the instrument.

    >>> assessment = {
    ...     'instrument': '@ALL',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'fields': None,
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: The "name", "fields", "calculations", and "post_load_calculations" properties are not allowed when @ALL is specified for the instrument.

    >>> assessment = {
    ...     'instrument': '@ALL',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'calculations': None,
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: The "name", "fields", "calculations", and "post_load_calculations" properties are not allowed when @ALL is specified for the instrument.

    >>> assessment = {
    ...     'instrument': '@ALL',
    ...     'selector': '/measure{id() :as assessment_uid}',
    ...     'post_load_calculations': [
    ...         {'name': 'postcalc1', 'type': 'text', 'expression': 'upper(assessment_uid)'},
    ...     ]
    ... }
    >>> val(assessment)
    Traceback (most recent call last):
        ...
    Error: The "name", "fields", "calculations", and "post_load_calculations" properties are not allowed when @ALL is specified for the instrument.


ProcessorVal
============

ProessorVal validates a single Processor definition::

    >>> from rex.mart import ProcessorVal
    >>> val = ProcessorVal()

    >>> proc = {
    ...     'id': 'myproc',
    ... }
    >>> val(proc)
    Record(id='myproc', options={})

    >>> proc = {
    ...     'id': 'otherproc',
    ...     'options': {
    ...         'foo': 'bar',
    ...     },
    ... }
    >>> val(proc)
    Record(id='otherproc', options={'foo': 'bar', 'bar': None})

    >>> proc = {
    ...     'id': 'otherproc',
    ...     'options': {
    ...         'foo': 'bar',
    ...         'bar': 'baz',
    ...     },
    ... }
    >>> val(proc)
    Record(id='otherproc', options={'foo': 'bar', 'bar': 'baz'})

    >>> proc = {
    ...     'id': 'doesntexist',
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    Error: Unknown Processor ID
    Got:
        doesntexist
    While validating field:
        id

    >>> proc = {
    ...     'options': {
    ...         'foo': 'bar',
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        id

    >>> proc = {
    ...     'id': 'otherproc',
    ...     'options': {
    ...         'bar': 'baz',
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    Error: Missing Processor Option
        foo
    While validating field:
        options

    >>> proc = {
    ...     'id': 'otherproc',
    ...     'options': {
    ...         'foo': 123,
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    Error: Expected a string
    Got:
        123
    While validating field:
        foo
    While validating field:
        options

    >>> proc = {
    ...     'id': 'otherproc',
    ...     'options': {
    ...         'foo': 'bar',
    ...         'fake': 123,
    ...     },
    ... }
    >>> val(proc)
    Traceback (most recent call last):
        ...
    Error: Unknown Processor Options
        fake
    While validating field:
        options


DefinitionVal
=============

DefinitionVal validates a single Mart Definition::

    >>> from rex.mart import DefinitionVal
    >>> val = DefinitionVal()

    >>> definition = {
    ...     'id': 'foo'
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'label': '',
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'label': 'My Label',
    ... }
    >>> val(definition)
    Record(id='foo', label='My Label', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'description': 'This is a database'
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description='This is a database', base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'quota': None
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'quota': {
    ...         'per_owner': 5
    ...     }
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=5), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'base': {
    ...         'type': 'fresh',
    ...     },
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'base': {
    ...         'type': 'fresh',
    ...         'name_token': 'custom_token_',
    ...     },
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token='custom_token_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

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
    Record(id='foo', label='foo', description=None, base=Record(type='copy', target='bar', name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=[{'table': 'my_table', 'with': [{'column': 'my_column', 'type': 'text'}]}], parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

    >>> definition = "{id: foo, base: {type: copy, target: bar}, deploy: [{table: my_table, with: [{column: my_column, type: text}]}]}"
    >>> val.parse(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='copy', target='bar', name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=[{'table': 'my_table', 'with': [{'column': 'my_column', 'type': 'text'}]}], parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])

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
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[Record(script='/blah/:merge', type='htsql', parameters={}), Record(script='/foo/:insert', type='htsql', parameters={})], assessments=[], post_assessment_scripts=[], processors=[])

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
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[Record(script='/foo/:insert', type='htsql', parameters={})], processors=[])

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
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[Record(instrument=['foo'], name=u'foo', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])], post_assessment_scripts=[], processors=[])

    >>> definition = {
    ...     'id': 'foo',
    ...     'assessments': [
    ...         {
    ...             'instrument': '@ALL',
    ...             'selector': '/measure{id() :as assessment_uid}',
    ...         },
    ...     ],
    ... }
    >>> validated = val(definition)
    >>> validated
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[Record(instrument=['alltypes'], name=u'alltypes', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['calculation'], name=u'calculation', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['calculation-complex'], name=u'calculation_complex', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['complex'], name=u'complex', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['disabled'], name=u'disabled', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart1'], name=u'mart1', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart10'], name=u'mart10', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart11'], name=u'mart11', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart12'], name=u'mart12', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart13'], name=u'mart13', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart14'], name=u'mart14', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart15'], name=u'mart15', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart2'], name=u'mart2', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart3'], name=u'mart3', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart4'], name=u'mart4', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart5'], name=u'mart5', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart6'], name=u'mart6', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart7'], name=u'mart7', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart8'], name=u'mart8', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart9'], name=u'mart9', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['mart9b'], name=u'mart9b', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['simple'], name=u'simple', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[]), Record(instrument=['texter'], name=u'texter', selector=Record(query='/measure{id() :as assessment_uid}', parameters={}), parental_relationship=Record(type='trunk', parent=[]), identifiable='any', fields=[], calculations=[], meta=None, post_load_calculations=[])], post_assessment_scripts=[], processors=[])
    >>> [a.name for a in validated.assessments]
    [u'alltypes', u'calculation', u'calculation_complex', u'complex', u'disabled', u'mart1', u'mart10', u'mart11', u'mart12', u'mart13', u'mart14', u'mart15', u'mart2', u'mart3', u'mart4', u'mart5', u'mart6', u'mart7', u'mart8', u'mart9', u'mart9b', u'simple', u'texter']

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

    >>> definition = {
    ...     'id': 'foo',
    ...     'base': {
    ...         'type': 'fresh',
    ...         'name_token': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
    ...     },
    ... }
    >>> val(definition)
    Traceback (most recent call last):
        ...
    Error: Name Token cannot exceed 33 characters in length
    Got:
        qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm
    While validating field:
        base.name_token

    >>> definition = {
    ...     'id': 'foo',
    ...     'processors': [
    ...         {
    ...             'id': 'myproc',
    ...         },
    ...         {
    ...             'id': 'otherproc',
    ...             'options': {
    ...                 'foo': 'bar',
    ...             },
    ...         },
    ...     ],
    ... }
    >>> val(definition)
    Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[Record(id='myproc', options={}), Record(id='otherproc', options={'foo': 'bar', 'bar': None})])

    >>> definition = {
    ...     'id': 'foo',
    ...     'parameters': [
    ...         {'name': 'foo', 'type': 'text'},
    ...         {'name': 'foo', 'type': 'integer'},
    ...     ],
    ... }
    >>> val(definition)
    Traceback (most recent call last):
        ...
    Error: Parameter Names (foo) cannot be duplicated within a Definition
    While validating field:
        parameters


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
    Record(definitions=[Record(id='foo', label='foo', description=None, base=Record(type='fresh', target=None, name_token=u'foo_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[]), Record(id='bar', label='bar', description=None, base=Record(type='fresh', target=None, name_token=u'bar_', fixed_name=None), quota=Record(per_owner=3), deploy=None, parameters=[], post_deploy_scripts=[], assessments=[], post_assessment_scripts=[], processors=[])])

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
    Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False, parameters={})

    >>> val({'owner': 'test', 'definition': 'some_def', 'halt_on_failure': True})
    Record(owner='test', definition='some_def', halt_on_failure=True, purge_on_failure=True, leave_incomplete=False, parameters={})

    >>> val({'owner': 'test', 'definition': 'some_def', 'purge_on_failure': False})
    Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=False, leave_incomplete=False, parameters={})

    >>> val({'owner': 'test', 'definition': 'some_def', 'leave_incomplete': True})
    Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=True, leave_incomplete=True, parameters={})

    >>> val({'owner': 'test', 'definition': 'some_def', 'parameters': {'foo': 'bar'}})
    Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False, parameters={'foo': 'bar'})

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
    [Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False, parameters={})]

    >>> val([{'owner': 'test', 'definition': 'some_def'}, {'owner': 'someoneelse', 'definition': 'other'}])
    [Record(owner='test', definition='some_def', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False, parameters={}), Record(owner='someoneelse', definition='other', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False, parameters={})]




    >>> rex.off()

