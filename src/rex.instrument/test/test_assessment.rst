**********
Assessment
**********


Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> rex = Rex('__main__', 'rex.instrument_demo')
    >>> rex.on()


The semi-abstract base Assessment class only implements a simple constructor
and string-rendering methods::

    >>> from rex.instrument.interface import User, Subject, Instrument, InstrumentVersion, Assessment
    >>> subject = Subject('subject1')
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
    >>> iv = InstrumentVersion('notreal456', instrument, INSTRUMENT, 1, 'jay', datetime(2014, 5, 22))
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
    >>> assessment = Assessment('fake123', subject, iv, ASSESSMENT)
    >>> assessment.get_display_name()
    'fake123'
    >>> str(assessment)
    'fake123'
    >>> str(assessment)
    'fake123'
    >>> repr(assessment)
    "Assessment('fake123', Subject('subject1'), InstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title'), 1))"

    >>> assessment.as_dict()
    {'uid': 'fake123', 'subject': {'uid': 'subject1', 'mobile_tn': None}, 'instrument_version': {'uid': 'notreal456', 'instrument': {'uid': 'fake123', 'title': 'My Instrument Title', 'code': 'fake123', 'status': 'active'}, 'version': 1, 'published_by': 'jay', 'date_published': datetime.datetime(2014, 5, 22, 0, 0)}, 'status': 'in-progress', 'evaluation_date': None}
    >>> assessment.as_json()
    '{"uid": "fake123", "subject": {"uid": "subject1", "mobile_tn": null}, "instrument_version": {"uid": "notreal456", "instrument": {"uid": "fake123", "title": "My Instrument Title", "code": "fake123", "status": "active"}, "version": 1, "published_by": "jay", "date_published": "2014-05-22T00:00:00"}, "status": "in-progress", "evaluation_date": null}'


The Subjects and InstrumentVersions passed to the constructor must actually be
instances of those classes or strings containing UIDs::

    >>> assessment = Assessment('fake123', object(), iv, ASSESSMENT)
    Traceback (most recent call last):
      ...
    ValueError: subject must be an instance of Subject or a UID of one
    >>> assessment = Assessment('fake123', subject, object(), ASSESSMENT)
    Traceback (most recent call last):
      ...
    ValueError: instrument_version must be an instance of InstrumentVersion or a UID of one

    >>> assessment = Assessment('fake123', 'subject1', 'simple1', ASSESSMENT)
    >>> assessment.subject
    DemoSubject('subject1')
    >>> assessment.instrument_version
    DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1)


The Evaluation Date must actually be a date (or datetime)::

    >>> assessment = Assessment('fake123', subject, iv, ASSESSMENT, evaluation_date='1980-05-22')
    Traceback (most recent call last):
        ...
    ValueError: "1980-05-22" is not a valid date

    >>> from datetime import date, datetime
    >>> assessment = Assessment('fake123', subject, iv, ASSESSMENT, evaluation_date=date(1980, 5, 22))
    >>> assessment.evaluation_date
    datetime.date(1980, 5, 22)
    >>> assessment = Assessment('fake123', subject, iv, ASSESSMENT, evaluation_date=datetime(1980, 5, 22, 12, 34, 56))
    >>> assessment.evaluation_date
    datetime.date(1980, 5, 22)


The data can be passed to the contructor as either a JSON-encoded string
or the dict equivalent::

    >>> assessment = Assessment('fake123', subject, iv, '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "values": {"q_fake": {"value": "my answer"}}}')
    >>> assessment.validate()


The data can be set or retrieved as either a JSON-encoded string or a dict
equivalent::

    >>> assessment.data
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': 'my answer'}}}
    >>> assessment.data = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'values': {'q_fake': {'value': 'a different answer'}}}

    >>> assessment.data_json
    '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "values": {"q_fake": {"value": "a different answer"}}}'
    >>> assessment.data_json = '{"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "values": {"q_fake": {"value": "something completely different"}}}'

    >>> assessment.data = None
    >>> assessment.data is None
    True
    >>> assessment.data_json is None
    True


Assessments have a status property which is readable and writable::

    >>> assessment.status
    'in-progress'
    >>> assessment.is_done
    False
    >>> assessment.status = Assessment.STATUS_COMPLETE
    >>> assessment.status
    'completed'
    >>> assessment.is_done
    True
    >>> assessment.status = 'something else'
    Traceback (most recent call last):
      ...
    ValueError: "something else" is not a valid Assessment status
    >>> assessment.status = Assessment.STATUS_IN_PROGRESS
    >>> assessment.status
    'in-progress'


Assessments have a `complete()` method that performs some end-of-data-collection
tasks on the Assessment and its Document::

    >>> user = User('fakeuser', 'fakelogin')
    >>> assessment = Assessment('fake123', subject, iv, '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "values": {"q_fake": {"value": "my answer"}}}')

    >>> assessment.status
    'in-progress'
    >>> assessment.get_meta('application') is None
    True
    >>> assessment.get_meta('dateCompleted') is None
    True
    >>> assessment.complete(user)
    >>> assessment.status
    'completed'
    >>> 'rex.instrument' in assessment.get_meta('application')
    True
    >>> assessment.get_meta('dateCompleted') is None
    False

    >>> assessment.complete(user)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: Cannot complete an Assessment that is already in a terminal state.


Assessments have some convenience methods for setting and retrieving metadata
properties on the Assessment Document::

    >>> assessment = Assessment('fake123', subject, iv, '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "values": {"q_fake": {"value": "my answer"}}}')

    >>> assessment.get_meta('foo') is None
    True
    >>> assessment.set_meta('foo', 'bar')
    >>> assessment.get_meta('foo')
    'bar'

    >>> assessment.get_meta('application') is None
    True
    >>> assessment.set_application_token('coolapp', '1.0')
    'coolapp/1.0'
    >>> assessment.set_application_token('helper')
    'coolapp/1.0 helper/?'
    >>> assessment.set_application_token('coolapp', '2.0')
    'coolapp/2.0 helper/?'
    >>> assessment.get_meta('application')
    'coolapp/2.0 helper/?'


There's a static method on Assessment named ``validate_data()`` that will
check the given structure against the RIOS specifications for Assessment
Documents. It will raise an exception if the data is not well-formed::

    >>> ASSESSMENT_JSON = json.dumps(ASSESSMENT)
    >>> INSTRUMENT_JSON = json.dumps(INSTRUMENT)
    >>> Assessment.validate_data(ASSESSMENT)
    >>> Assessment.validate_data(ASSESSMENT, instrument_definition=INSTRUMENT)
    >>> Assessment.validate_data(ASSESSMENT_JSON)
    >>> Assessment.validate_data(ASSESSMENT_JSON, instrument_definition=INSTRUMENT)
    >>> Assessment.validate_data(ASSESSMENT, instrument_definition=INSTRUMENT_JSON)
    >>> Assessment.validate_data(ASSESSMENT_JSON, instrument_definition=INSTRUMENT_JSON)

    >>> BAD_ASSESSMENT = deepcopy(ASSESSMENT)
    >>> del BAD_ASSESSMENT['values']
    >>> Assessment.validate_data(BAD_ASSESSMENT)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: The following problems were encountered when validating this Assessment:
    values: Required

    >>> Assessment.validate_data('foo')
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Assessment Documents must be mapped objects.

    >>> Assessment.validate_data('{foo')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Invalid JSON/YAML provided: Failed to parse a YAML document:
        ...

    >>> Assessment.validate_data(ASSESSMENT, instrument_definition='foo')
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Instrument Definitions must be mapped objects.

    >>> Assessment.validate_data(ASSESSMENT, instrument_definition='{foo')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Invalid Instrument JSON/YAML provided: Failed to parse a YAML document:
        ...


There's a static method on Assessment named ``generate_empty_data()`` that will
create an Assessment Document that contains no response data, but is in the
structure expected for the specified InstrumentVersion::

    >>> Assessment.generate_empty_data(iv)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': None}}}
    >>> Assessment.validate_data(Assessment.generate_empty_data(iv))

    >>> Assessment.generate_empty_data(INSTRUMENT)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': None}}}
    >>> Assessment.validate_data(Assessment.generate_empty_data(INSTRUMENT))

    >>> Assessment.generate_empty_data(INSTRUMENT_JSON)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': None}}}
    >>> Assessment.validate_data(Assessment.generate_empty_data(INSTRUMENT_JSON))

    >>> Assessment.generate_empty_data('foo')
    Traceback (most recent call last):
        ...
    TypeError: Instrument Definitions must be mapped objects.

    >>> Assessment.generate_empty_data('{foo')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    ValueError: Invalid JSON/YAML provided: Failed to parse a YAML document:
        ...

    >>> MATRIX_INSTRUMENT = deepcopy(INSTRUMENT)
    >>> MATRIX_INSTRUMENT['record'].append({
    ...     'id': 'q_matrix',
    ...     'type': {
    ...         'base': 'matrix',
    ...         'columns': [
    ...             {
    ...                 'id': 'col1',
    ...                 'type': 'text',
    ...             },
    ...             {
    ...                 'id': 'col2',
    ...                 'type': 'text',
    ...             },
    ...         ],
    ...         'rows': [
    ...             {
    ...                 'id': 'row1',
    ...             },
    ...             {
    ...                 'id': 'row2',
    ...             },
    ...         ]
    ...     }
    ... })
    >>> iv2 = InstrumentVersion('notreal456', instrument, MATRIX_INSTRUMENT, 1, 'jay', datetime(2014, 5, 22))
    >>> Assessment.generate_empty_data(iv2)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': None}, 'q_matrix': {'value': {'row1': {'col1': {'value': None}, 'col2': {'value': None}}, 'row2': {'col1': {'value': None}, 'col2': {'value': None}}}}}}
    >>> Assessment.validate_data(Assessment.generate_empty_data(iv2))


Assessments can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> assessment1 = Assessment('fake123', subject, iv, ASSESSMENT)
    >>> assessment2 = Assessment('fake456', subject, iv, ASSESSMENT)
    >>> subject2 = Subject('foobar')
    >>> assessment3 = Assessment('fake123', subject2, iv, ASSESSMENT)
    >>> assessment1 == assessment2
    False
    >>> assessment1 == assessment3
    True
    >>> assessment1 != assessment2
    True
    >>> assessment1 != assessment3
    False
    >>> mylist = [assessment1]
    >>> assessment1 in mylist
    True
    >>> assessment2 in mylist
    False
    >>> assessment3 in mylist
    True
    >>> myset = set(mylist)
    >>> assessment1 in myset
    True
    >>> assessment2 in myset
    False
    >>> assessment3 in myset
    True

    >>> assessment1 < assessment2
    True
    >>> assessment1 <= assessment3
    True
    >>> assessment2 > assessment1
    True
    >>> assessment3 >= assessment1
    True


