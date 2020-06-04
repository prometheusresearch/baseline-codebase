**************
CalculationSet
**************


Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from rex.core import Rex, SandboxPackage
    >>> from datetime import datetime
    >>> from rex.instrument.util import get_implementation
    >>> rex = Rex('__main__', 'rex.demo.instrument')
    >>> rex.on()


The semi-abstract base CalculationSet class only implements a simple constructor
and string-rendering methods::

    >>> from rex.instrument.interface import  User, Subject, Instrument, InstrumentVersion, Assessment, CalculationSet
    >>> instrument = Instrument('fake123', 'fake123', 'My Instrument Title')
    >>> INSTRUMENT = {
    ...     'id': 'urn:test-instrument',
    ...     'version': '1.1',
    ...     'title': 'The InstrumentVersion Title',
    ...     'record': [
    ...         {
    ...             'id': 'q_fake',
    ...             'type': 'text'
    ...         }
    ...     ]
    ... }
    >>> iv = InstrumentVersion('notreal456', instrument, INSTRUMENT, 1, 'sirius', datetime(2015, 6, 9))
    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'text',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'assessment[''q_fake''].upper()'
    ...           }
    ...         },
    ...     ]
    ... }

    >>> calculationset = CalculationSet('fake123', iv.uid, CALCULATIONSET)

    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)

    >>> calculationset.get_display_name()
    'fake123'

    >>> str(calculationset)
    'fake123'

    >>> str(calculationset)
    'fake123'

    >>> repr(calculationset)
    "CalculationSet('fake123', InstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title'), 1))"

    >>> calculationset.as_dict()
    {'uid': 'fake123', 'instrument_version': {'uid': 'notreal456', 'instrument': {'uid': 'fake123', 'title': 'My Instrument Title', 'code': 'fake123', 'status': 'active'}, 'version': 1, 'published_by': 'sirius', 'date_published': datetime.datetime(2015, 6, 9, 0, 0)}}

    >>> calculationset.as_json()
    '{"uid": "fake123", "instrument_version": {"uid": "notreal456", "instrument": {"uid": "fake123", "title": "My Instrument Title", "code": "fake123", "status": "active"}, "version": 1, "published_by": "sirius", "date_published": "2015-06-09T00:00:00"}}'


The InstrumentVersions passed to the constructor must actually be
instances of those classes or strings containing UIDs::

    >>> calculationset = CalculationSet('fake123', object(), CALCULATIONSET)
    Traceback (most recent call last):
        ...
    ValueError: instrument_version must be an instance of InstrumentVersion or a UID of one


The definition can be passed to the contructor as either a JSON-encoded string
or the dict equivalent::

    >>> calculationset = CalculationSet('fake123', iv, object())
    >>> calculationset.validate()
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: CalculationSet Definition must be mapped objects.

    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.validate()

    >>> calculationset = CalculationSet('fake123', iv, '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "calc1", "type": "text", "method": "python", "options": {"expression": "assessment[\'q_fake\'].upper()"}}]}')
    >>> calculationset.validate()

The definition can be set or retrieved as either a JSON/YAML-encoded string, or
a dict equivalent::

    >>> calculationset.definition_json
    '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "calc1", "type": "text", "method": "python", "options": {"expression": "assessment[\'q_fake\'].upper()"}}]}'

    >>> calculationset.definition_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ncalculations:\n- id: calc1\n  type: text\n  method: python\n  options: {expression: 'assessment[''q_fake''].upper()'}"

    >>> calculationset.definition_json = '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "calc1", "type": "text", "method": "python", "options": {"expression": "assessment[\'q_fake\'].upper()"}}]}'
    >>> calculationset.definition
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'calculations': [{'id': 'calc1', 'type': 'text', 'method': 'python', 'options': {'expression': "assessment['q_fake'].upper()"}}]}

    >>> calculationset.definition_yaml = "instrument: {id: 'urn:test-instrument', version: '1.1'}\ncalculations:\n- id: calc1\n  type: text\n  method: python\n  options: {expression: 'assessment[''q_fake''].upper()'}"

    >>> calculationset.definition
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'calculations': [{'id': 'calc1', 'type': 'text', 'method': 'python', 'options': {'expression': "assessment['q_fake'].upper()"}}]}

There's a static method on CalculationSet named ``validate_definition()``
that will check the given CalculatioSet definistion against the RIOS
specifications for InstrumentVersion Definitions. It will raise an exception
if the CalculationSet or InstrumentVersion definition is not well-formed::

    >>> INSTRUMENT_VERSION_JSON = iv.definition_json
    >>> INSTRUMENT_VERSION = iv.definition
    >>> CalculationSet.validate_definition(CALCULATIONSET, INSTRUMENT_VERSION)
    >>> CalculationSet.validate_definition(CALCULATIONSET, INSTRUMENT_VERSION_JSON)

    >>> CALCULATIONSET_JSON = calculationset.definition_json
    >>> CalculationSet.validate_definition(CALCULATIONSET_JSON, INSTRUMENT_VERSION)
    >>> CalculationSet.validate_definition(CALCULATIONSET_JSON, INSTRUMENT_VERSION_JSON)

    >>> BAD_CALCULATIONSET = deepcopy(CALCULATIONSET)
    >>> del BAD_CALCULATIONSET['instrument']
    >>> CalculationSet.validate_definition(BAD_CALCULATIONSET, INSTRUMENT_VERSION)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: The following problems were encountered when validating this CalculationSet:
    instrument: Required

    >>> BAD_CALCULATIONSET_JSON = json.dumps(BAD_CALCULATIONSET)
    >>> CalculationSet.validate_definition(BAD_CALCULATIONSET_JSON, INSTRUMENT_VERSION)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: The following problems were encountered when validating this CalculationSet:
    instrument: Required

    >>> BAD_INSTRUMENT_VERSION = deepcopy(INSTRUMENT_VERSION)
    >>> del BAD_INSTRUMENT_VERSION['title']
    >>> CalculationSet.validate_definition(CALCULATIONSET, BAD_INSTRUMENT_VERSION)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: The following problems were encountered when validating this CalculationSet:
    title: Required

    >>> BAD_INSTRUMENT_VERSION_JSON = json.dumps(BAD_INSTRUMENT_VERSION)
    >>> CalculationSet.validate_definition(CALCULATIONSET, BAD_INSTRUMENT_VERSION_JSON)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: The following problems were encountered when validating this CalculationSet:
    title: Required

    >>> CalculationSet.validate_definition(object(), INSTRUMENT_VERSION_JSON)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: CalculationSet Definition must be mapped objects.

    >>> CalculationSet.validate_definition(CALCULATIONSET, object())
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Instrument Definitions must be mapped objects.

    >>> CalculationSet.validate_definition('{foo')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Invalid JSON/YAML provided: Failed to parse a YAML document:
        ...

    >>> CalculationSet.validate_definition(CALCULATIONSET, '{foo')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Invalid Instrument JSON/YAML provided: Failed to parse a YAML document:
        ...


CalculationSet has a `execute(assessment)` method that returns results of
computing all option.expression and option.expression of
current assessment.instrument_version::

    >>> subject = Subject('subject1')
    >>> ASSESSMENT = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'values': {
    ...         'q_fake': {
    ...             'value': 'my answer'
    ...         }
    ...     }
    ... }
    >>> assessment = Assessment('fake123', subject, iv, ASSESSMENT, evaluation_date=datetime(2015, 6, 2), status=Assessment.STATUS_COMPLETE)
    >>> calculationset.definition
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'calculations': [{'id': 'calc1', 'type': 'text', 'method': 'python', 'options': {'expression': "assessment['q_fake'].upper()"}}]}

    >>> calculationset.execute(assessment)
    {'calc1': 'MY ANSWER'}

Execute calculations of htsql and python method::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'text',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'assessment[\'q_fake\'].upper()'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'text',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': 'upper($q_fake)'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 'MY ANSWER', 'calc2': 'MY ANSWER'}

calculations contained previous results::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'text',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'assessment[\'q_fake\'].upper()'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'text',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': 'upper($q_fake)'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc3',
    ...           'type': 'integer',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'len(calculations[\'calc1\']+calculations[\'calc2\'])'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc4',
    ...           'type': 'integer',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': 'length($calc1+$calc2)'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 'MY ANSWER', 'calc2': 'MY ANSWER', 'calc3': 18, 'calc4': 18}

calculation expression can include variables, calculated by the rules defined
with subclasses of CalculationScopeAddon::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'boolean',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'subject_status is None'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'text',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '!is_null($subject_status)'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc3',
    ...           'type': 'text',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'subject_status'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': True, 'calc2': 'False', 'calc3': None}

HTSQL calculation expressions don't allow ETL statements::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'text',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '/{} :as individual/:insert'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: Unexpected htsql /{} :as individual/:insert: Found unknown function:
        insert
    While translating:
        /{} :as individual/:insert
        ^^^^^^^^^^^^^^^^^^^^^^^^^^
    While executing calculation:
        calc1

CalculationSet.execute() handles situations where the calculations return
Decimal values::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'float',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '4/5'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 0.8}

CalculationSet.execute(...) runs coerce_instrument_type(...) method to format
values of some predefined types
(date, time, dateTime, integer, text, enumeration); result of other calculation
types returned as is::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'date',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'datetime.date(2015, 5, 1)'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': '2015-05-01'}

CalculationSet.execute(...) fails when computed unexpected result::

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '\'2001-02-03\''
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': '2001-02-03'}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '123'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Unexpected calculation result type -- Expected "date" got "int"
    While executing calculation:
        calc1

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '\'Hello world!\''
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Unexpected calculation result type -- Expected "date" got "str"
    While executing calculation:
        calc1

    >>> CALCULATIONSET['calculations'][0]['type'] = 'time'
    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'datetime.datetime(2015, 5, 1, 11, 34, 56)'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': '11:34:56'}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '\'12:34:56\''
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': '12:34:56'}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '\'Hello world!\''
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Unexpected calculation result type -- Expected "time" got "str"
    While executing calculation:
        calc1

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '358'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Unexpected calculation result type -- Expected "time" got "int"
    While executing calculation:
        calc1

    >>> CALCULATIONSET['calculations'][0]['type'] = 'dateTime'
    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'datetime.datetime(2015, 5, 1, 11, 34, 56)'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': '2015-05-01T11:34:56'}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'datetime.date(2015, 5, 1)'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': '2015-05-01T00:00:00'}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '\'2001-02-03T12:34:56\''
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': '2001-02-03T12:34:56'}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '\'Hello world!\''
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Unexpected calculation result type -- Expected "dateTime" got "str"
    While executing calculation:
        calc1

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'True'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Unexpected calculation result type -- Expected "dateTime" got "bool"
    While executing calculation:
        calc1

    >>> CALCULATIONSET['calculations'][0]['type'] = 'integer'
    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '10+15'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 25}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'str(10+15)'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 25}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '\'Hi!\''
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Unexpected calculation result type -- Expected "integer" got "str"
    While executing calculation:
        calc1

    >>> CALCULATIONSET['calculations'][0]['type'] = 'float'
    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '10.01 + 15'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 25.009999999999998}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'str(10+15)'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 25.0}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '\'2015-01-01\''
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Unexpected calculation result type -- Expected "float" got "str"
    While executing calculation:
        calc1

    >>> CALCULATIONSET['calculations'][0]['type'] = 'boolean'
    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'object() is None'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': False}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'int(1)'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': True}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'int(0)'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': False}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'int(2)'
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': True}

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = '\'Morning!\''
    >>> calculationset = CalculationSet('fake123', iv, CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Unexpected calculation result type -- Expected "boolean" got "str"
    While executing calculation:
        calc1


execute calculation contained enumeration question::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:calculation-complex',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'text',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'assessment[\'q_enumeration\']'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'text',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '$q_enumeration'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc3',
    ...           'type': 'boolean',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'calculations[\'calc1\']==calculations[\'calc2\']'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> assessment = get_implementation('assessment').get_by_uid('assessment8')
    >>> calculationset.execute(assessment)
    {'calc1': 'myenum', 'calc2': 'myenum', 'calc3': True}

execute calculations of enumerationSet question::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:calculation-complex',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'boolean',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': '\'black\' in assessment[\'q_enumerationset\'] or \'white\' in assessment[\'q_enumerationset\'] or \'red\' in assessment[\'q_enumerationset\']'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'boolean',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '\'black\'=$q_enumerationset | \'white\'=$q_enumerationset | \'red\'=$q_enumerationset'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc3',
    ...           'type': 'boolean',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'calculations[\'calc1\']==calculations[\'calc2\']'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': True, 'calc2': True, 'calc3': True}

execute calculations of matrix question::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:calculation-complex',
    ...         'version': '1.0'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'integer',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'assessment[\'q_matrix\'][\'row1\'][\'column1\'] + assessment[\'q_matrix\'][\'row2\'][\'column1\']'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'integer',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '$q_matrix_row1_column1 + $q_matrix_row2_column1'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc3',
    ...           'type': 'boolean',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'calculations[\'calc1\']==calculations[\'calc2\']'
    ...           }
    ...         }
    ...     ]
    ... }

    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 105, 'calc2': 105, 'calc3': True}

execute calculations of recordSet question can be defined with python method only::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'text',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'assessment[\'q_recordlist\'][0][\'hello\']'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'text',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': '\', \'.join(assessment[\'q_recordlist\'][0].keys())'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 'hi', 'calc2': 'hello, goodbye'}

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'text',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '$q_recordlist_0_hello'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: Unexpected htsql $q_recordlist_0_hello: Found unknown reference:
        $q_recordlist_0_hello
    While translating:
        $q_recordlist_0_hello
        ^^^^^^^^^^^^^^^^^^^^^
    While executing calculation:
        calc1

execute calculations of boolean question when assessment keeps null as a value::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'boolean',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'False if assessment[\'q_boolean\'] is None else True'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'boolean',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': 'if(is_null($q_boolean), false, true)'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc3',
    ...           'type': 'boolean',
    ...           'method': 'python',
    ...           'options': {
    ...             'expression': 'calculations[\'calc1\']==calculations[\'calc2\']'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> assessment = get_implementation('assessment').get_by_uid('assessment8')
    >>> calculationset.execute(assessment)
    {'calc1': False, 'calc2': False, 'calc3': True}

execute(..) fails if expression contains value that cannot be run correctly::

    >>> CALCULATIONSET['calculations'][0]['options']['expression'] = 'str(1+1'
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
    ...
    rex.instrument.errors.InstrumentError: Unable to calculate expression str(1+1: unexpected EOF while parsing (<string>, line 1)
    While executing calculation:
        calc1

execute HTSQL expressions of varying forms::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'integer',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '2 * 2'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'integer',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '{3 * 3}'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc3',
    ...           'type': 'integer',
    ...           'method': 'htsql',
    ...           'options': {
    ...             'expression': '/{4 * 4}'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': 4, 'calc2': 9, 'calc3': 16}

There is calculation callable option, that can be used as follows::

    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'calculations': [
    ...         {
    ...           'id': 'calc1',
    ...           'type': 'text',
    ...           'method': 'python',
    ...           'options': {
    ...             'callable': 'rex.demo.instrument.my_calculation1'
    ...           }
    ...         },
    ...         {
    ...           'id': 'calc2',
    ...           'type': 'text',
    ...           'method': 'python',
    ...           'options': {
    ...             'callable': 'rex.demo.instrument.my_calculation2'
    ...           }
    ...         }
    ...     ]
    ... }
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    {'calc1': '2.23', 'calc2': '2.23'}

execute(...) fails if module undefined::

    >>> CALCULATIONSET['calculations'][0]['options']['callable'] = 'my_calculation2'
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: Unexpected callable my_calculation2: module name is expected.
    While executing calculation:
        calc1

or module doesnot exist::

    >>> CALCULATIONSET['calculations'][0]['options']['callable'] = 'rex.instrument_demo1.my_calculation1'
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: Unexpected callable rex.instrument_demo1.my_calculation1: unable to import module rex.instrument_demo1: No module named 'rex.instrument_demo1'.
    While executing calculation:
        calc1

or module doesnot contain given object name::

    >>> CALCULATIONSET['calculations'][0]['options']['callable'] = 'rex.demo.instrument.my_calculation'
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: Unexpected callable rex.demo.instrument.my_calculation: suitable callable object not found: module 'rex.demo.instrument' has no attribute 'my_calculation'
    While executing calculation:
        calc1

or given object is not callable::

    >>> CALCULATIONSET['calculations'][0]['options']['callable'] = 'rex.demo.instrument.my_calculation3'
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: Unexpected callable option rex.demo.instrument.my_calculation3: my_calculation3 is not callable.
    While executing calculation:
        calc1

    >>> CALCULATIONSET['calculations'][0]['options']['callable'] = 'rex.demo.instrument.my_calculation4'
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: Execution of rex.demo.instrument.my_calculation4 failed: __call__() missing 1 required positional argument: 'calculations'
    While executing calculation:
        calc1

execute(...) fails when application started with incorrect modules list defined
by the setting instrument_calculationmethod_default_module_list::

    >>> rex = Rex('__main__', 'rex.demo.instrument',
    ...     instrument_calculationmethod_default_module_list=['math1'])
    >>> rex.on()

    >>> CALCULATIONSET['calculations'][0]['type'] = 'integer'
    >>> CALCULATIONSET['calculations'][0]['options'] = {'expression': 'int(1)'}
    >>> calculationset = CalculationSet('fake123', 'calculation2', CALCULATIONSET)
    >>> calculationset.execute(assessment)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: Got unexpected module math1 from setting 'instrument_calculationmethod_default_module_list'
    While executing calculation:
        calc1



    >>> rex.off()

