****
Task
****


Set up the environment::

    >>> from rex.instrument.interface import *
    >>> from datetime import datetime
    >>> from copy import deepcopy
    >>> from rex.core import Rex
    >>> rex = Rex('__main__', 'rex.instrument_demo')
    >>> rex.on()

The semi-abstract base Task class only implements a simple constructor
and string-rendering methods::

    >>> subject = Subject('fake123')
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

    >>> task = Task('bar999', subject, instrument, 100, assessment)
    >>> task.get_display_name()
    'bar999'
    >>> str(task)
    'bar999'
    >>> str(task)
    'bar999'
    >>> repr(task)
    "Task('bar999', Subject('fake123'), Instrument('fake123', 'My Instrument Title'))"
    >>> task.priority
    100
    >>> task.subject
    Subject('fake123')
    >>> task.assessment
    Assessment('fake123', Subject('fake123'), InstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title'), 1))
    >>> task.instrument
    Instrument('fake123', 'My Instrument Title')

    >>> task.as_dict()
    {'uid': 'bar999', 'subject': {'uid': 'fake123', 'mobile_tn': None}, 'instrument': {'uid': 'fake123', 'title': 'My Instrument Title', 'code': 'fake123', 'status': 'active'}, 'priority': 100, 'status': 'not-started', 'num_required_entries': 1, 'facilitator': None, 'due_date': None}
    >>> task.as_json()
    '{"uid": "bar999", "subject": {"uid": "fake123", "mobile_tn": null}, "instrument": {"uid": "fake123", "title": "My Instrument Title", "code": "fake123", "status": "active"}, "priority": 100, "status": "not-started", "num_required_entries": 1, "facilitator": null, "due_date": null}'


The Subjects, Instruments, and Assessments passed to the constructor must
actually be instances of those classes or strings containing UIDs::

    >>> task = Task('bar999', object(), instrument, 100)
    Traceback (most recent call last):
      ...
    ValueError: subject must be an instance of Subject or a UID of one
    >>> task = Task('bar999', subject, object(), 100)
    Traceback (most recent call last):
      ...
    ValueError: instrument must be an instance of Instrument or a UID of one
    >>> task = Task('bar999', subject, instrument, 100, 6)
    Traceback (most recent call last):
      ...
    ValueError: assessment must be an instance of Assessment or a UID of one

    >>> task = Task('bar999', 'subject1', 'simple', 100, assessment='assessment1')
    >>> task.subject
    DemoSubject('subject1')
    >>> task.instrument
    DemoInstrument('simple', 'Simple Instrument')
    >>> task.assessment
    DemoAssessment('assessment1', DemoSubject('subject1'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1))


The priority passed to the constructor must be an integer::

    >>> task = Task('bar999', subject, instrument, 'foo')
    Traceback (most recent call last):
      ...
    ValueError: priority must be an integer


Tasks have a property to retrieve the InstrumentVersion they're associated with::

    >>> task = Task('bar999', subject, instrument, 100, assessment)
    >>> task.instrument_version
    InstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title'), 1)


Tasks have a property to set or retrieve the Assessment they're associated with::

    >>> task = Task('bar999', subject, instrument, 100, assessment)
    >>> task.assessment
    Assessment('fake123', Subject('fake123'), InstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title'), 1))
    >>> task.assessment = Assessment('NEW456', subject, iv, ASSESSMENT)
    >>> task.assessment
    Assessment('NEW456', Subject('fake123'), InstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title'), 1))
    >>> task.assessment = 42
    Traceback (most recent call last):
        ...
    ValueError: "42" is not a valid Assessment


Tasks have ``status``, ``facilitator``, and ``due_date`` properties which are
readable and writable::

    >>> task = Task('bar999', subject, instrument, 100)
    >>> task.status
    'not-started'
    >>> task.is_done
    False
    >>> task.status = Task.STATUS_STARTED
    >>> task.is_done
    False
    >>> task.status = Task.STATUS_COMPLETE
    >>> task.status
    'complete'
    >>> task.is_done
    True
    >>> task.status = 'something else'
    Traceback (most recent call last):
      ...
    ValueError: "something else" is not a valid Task status

    >>> task.facilitator is None
    True
    >>> user = User('rex.jay', 'jay')
    >>> task.facilitator = user
    >>> task.facilitator
    User('rex.jay', 'jay')
    >>> task.facilitator = 'user1'
    >>> task.facilitator
    DemoUser('user1', 'user1')
    >>> task.facilitator = None
    >>> task.facilitator is None
    True
    >>> task.facilitator = 123
    Traceback (most recent call last):
      ...
    ValueError: "123" is not a valid Facilitator

    >>> task.due_date is None
    True
    >>> task.due_date = datetime(2015, 5, 22, 12, 34, 56)
    >>> task.due_date
    datetime.datetime(2015, 5, 22, 12, 34, 56)
    >>> task.due_date = None
    >>> task.due_date is None
    True
    >>> task.due_date = 'now'
    Traceback (most recent call last):
        ...
    ValueError: "now" is not a valid Due Date


The start_entry() method will create an Entry for the associated Assessment
(creating the Assessment first, if one does not exist)::

    >>> task = Task('foo123', subject, Instrument.get_implementation().get_by_uid('simple'), 42)
    >>> task.assessment is None
    True
    >>> task.start_entry(user)
    DemoEntry('fake_entry_1', DemoAssessment('fake_assessment_1', Subject('fake123'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1)), 'preliminary')
    >>> task.assessment
    DemoAssessment('fake_assessment_1', Subject('fake123'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1))


Tasks have a num_required_entries property which is readable only::

    >>> task = Task('bar999', subject, instrument, 100)
    >>> task.num_required_entries
    1

    >>> task = Task('bar999', subject, instrument, 100, num_required_entries=3)
    >>> task.num_required_entries
    3


After a Task has collected a series of Entries, the ``get_discrepancies()``
method can be used to generate a dictionary describing the differences in
Assessment Data collected for each Entry. The ``solve_discrepancies()``
method can then be used to merge the Assessment Data in the Entries together::

    >>> INSTRUMENT = {
    ...     'id': 'urn:test-instrument',
    ...     'version': '1.1',
    ...     'title': 'The InstrumentVersion Title',
    ...     'record': [
    ...         {
    ...             'id': 'q_fake',
    ...             'type': 'text'
    ...         },
    ...         {
    ...             'id': 'q_foo',
    ...             'type': 'integer'
    ...         },
    ...         {
    ...             'id': 'q_blah',
    ...             'type': 'enumerationSet',
    ...             'enumerations': {
    ...                 'red': {},
    ...                 'blue': {},
    ...                 'green': {}
    ...             }
    ...         }
    ...     ]
    ... }
    >>> DATA = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1'
    ...     },
    ...     'values': {
    ...         'q_fake': {
    ...             'value': 'my answer'
    ...         },
    ...         'q_foo': {
    ...             'value': 45
    ...         },
    ...         'q_blah': {
    ...             'value': ['red', 'green']
    ...         }
    ...     },
    ...     'meta': {
    ...         'application': 'SomeApp/1.0',
    ...         'dateCompleted': '2010-01-01T12:34:56',
    ...         'foo': 'bar',
    ...         'calculations': {'calc1': 2}
    ...     }
    ... }
    >>> instrument = Instrument('fake123', 'fake123', 'My Instrument Title')
    >>> iv = InstrumentVersion('notreal456', instrument, INSTRUMENT, 1, 'jay', datetime(2014, 5, 22))
    >>> assessment = Assessment('fake123', subject, iv, DATA)
    >>> task = Task('bar999', subject, instrument, 100, assessment)
    >>> entry1 = Entry('entry333', assessment, Entry.TYPE_PRELIMINARY, DATA, 'bob', datetime(2014, 5, 22, 12, 34, 56), 1)
    >>> entry2 = Entry('entry444', assessment, Entry.TYPE_PRELIMINARY, DATA, 'joe', datetime(2014, 5, 22, 12, 34, 56), 2)
    >>> entry3 = Entry('entry555', assessment, Entry.TYPE_PRELIMINARY, DATA, 'jim', datetime(2014, 5, 22, 12, 34, 56),3 )
    >>> entries = [entry1, entry2, entry3]

Identical Entries should yield no discrepancies and a solution that is
equivalent to the Entries' data::

    >>> task.get_discrepancies(entries=entries)
    {}
    >>> task.solve_discrepancies({}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': 'my answer', 'explanation': None, 'annotation': None}, 'q_foo': {'value': 45, 'explanation': None, 'annotation': None}, 'q_blah': {'value': ['red', 'green'], 'explanation': None, 'annotation': None}}, 'meta': {'application': 'SomeApp/1.0', 'dateCompleted': '2010-01-01T12:34:56', 'foo': 'bar'}}

Only given one Entry, it should yield no discrepancies and a solution that is
equivalent to the one Entry's data::

    >>> task.get_discrepancies(entries=[entry1])
    {}
    >>> task.solve_discrepancies({}, entries=[entry1])
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': 'my answer'}, 'q_foo': {'value': 45}, 'q_blah': {'value': ['red', 'green']}}, 'meta': {'application': 'SomeApp/1.0', 'dateCompleted': '2010-01-01T12:34:56', 'foo': 'bar', 'calculations': {'calc1': 2}}}

One entry with a different value should be spotted and solved appropriately::

    >>> entry3.data['values']['q_fake']['value'] = 'a different answer'
    >>> task.get_discrepancies(entries=entries)
    {'q_fake': {'entry333': 'my answer', 'entry444': 'my answer', 'entry555': 'a different answer'}}
    >>> task.solve_discrepancies({}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': 'my answer', 'explanation': None, 'annotation': None}, 'q_foo': {'value': 45, 'explanation': None, 'annotation': None}, 'q_blah': {'value': ['red', 'green'], 'explanation': None, 'annotation': None}}, 'meta': {'application': 'SomeApp/1.0', 'dateCompleted': '2010-01-01T12:34:56', 'foo': 'bar'}}
    >>> task.solve_discrepancies({'q_fake': 'the answer'}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': 'the answer', 'explanation': None, 'annotation': None}, 'q_foo': {'value': 45, 'explanation': None, 'annotation': None}, 'q_blah': {'value': ['red', 'green'], 'explanation': None, 'annotation': None}}, 'meta': {'application': 'SomeApp/1.0', 'dateCompleted': '2010-01-01T12:34:56', 'foo': 'bar'}}
    >>> task.solve_discrepancies({'q_fake': None}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': None, 'explanation': None, 'annotation': None}, 'q_foo': {'value': 45, 'explanation': None, 'annotation': None}, 'q_blah': {'value': ['red', 'green'], 'explanation': None, 'annotation': None}}, 'meta': {'application': 'SomeApp/1.0', 'dateCompleted': '2010-01-01T12:34:56', 'foo': 'bar'}}

    >>> entry2.data['values']['q_blah']['value'] = ['blue']
    >>> task.get_discrepancies(entries=entries)
    {'q_fake': {'entry333': 'my answer', 'entry444': 'my answer', 'entry555': 'a different answer'}, 'q_blah': {'entry333': ['red', 'green'], 'entry444': ['blue'], 'entry555': ['red', 'green']}}

If a field only has one explanation in the group, use it in the solution::

    >>> entry2.data['values']['q_fake']['explanation'] = 'Because I said so.'
    >>> task.solve_discrepancies({}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': 'my answer', 'explanation': 'Because I said so.', 'annotation': None}, 'q_foo': {'value': 45, 'explanation': None, 'annotation': None}, 'q_blah': {'value': ['red', 'green'], 'explanation': None, 'annotation': None}}, 'meta': {'application': 'SomeApp/1.0', 'dateCompleted': '2010-01-01T12:34:56', 'foo': 'bar'}}

If a field as more than one explanation in the group, merge them::

    >>> entry3.data['values']['q_fake']['explanation'] = 'Why not?'
    >>> task.solve_discrepancies({}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_fake': {'value': 'my answer', 'explanation': '2014-05-22 12:34:56 / joe: Because I said so.\n\n2014-05-22 12:34:56 / jim: Why not?', 'annotation': None}, 'q_foo': {'value': 45, 'explanation': None, 'annotation': None}, 'q_blah': {'value': ['red', 'green'], 'explanation': None, 'annotation': None}}, 'meta': {'application': 'SomeApp/1.0', 'dateCompleted': '2010-01-01T12:34:56', 'foo': 'bar'}}

If the metadata values are different, they'll be merged appropriately::

    >>> entry2.data = deepcopy(entry1.data)
    >>> entry3.data = deepcopy(entry1.data)
    >>> entry2.data['meta']['application'] = 'OtherApp/2.1 SomeApp/1.0'
    >>> entry2.data['meta']['foo'] = 'baz'
    >>> entry2.data['meta']['dateCompleted'] = 'broken'
    >>> entry3.data['meta']['happy'] = 'yup'
    >>> entry3.data['meta']['dateCompleted'] = '2015-05-05T11:34:55'
    >>> task.solve_discrepancies({}, entries=entries)['meta']
    {'application': 'OtherApp/2.1 SomeApp/1.0', 'dateCompleted': '2015-05-05T11:34:55', 'foo': 'bar', 'happy': 'yup'}

If the arrays for enumerationSet values are the same, but in different orders,
they should not trigger a discrepancy::

    >>> entry2.data = deepcopy(entry1.data)
    >>> entry3.data = deepcopy(entry1.data)
    >>> entry2.data['values']['q_blah']['value'] = ['green', 'red']
    >>> task.get_discrepancies(entries=entries)
    {}

    >>> entry2.data['values']['q_blah']['value'] = ['green']
    >>> task.get_discrepancies(entries=entries)
    {'q_blah': {'entry333': ['red', 'green'], 'entry444': ['green'], 'entry555': ['red', 'green']}}

Set up tests with recordList fields::

    >>> del iv.definition['record'][0]
    >>> del iv.definition['record'][0]
    >>> del iv.definition['record'][0]
    >>> iv.definition['record'].append({
    ...     'id': 'q_rec',
    ...     'type': {
    ...         'base': 'recordList',
    ...         'record': [
    ...             {
    ...                 'id': 'dink',
    ...                 'type': 'text'
    ...             },
    ...             {
    ...                 'id': 'donk',
    ...                 'type': 'boolean'
    ...             }
    ...         ]
    ...     }
    ... })
    >>> RECORD_VALUES = {
    ...     'q_rec': {
    ...         'value': [
    ...             {
    ...                 'dink': {
    ...                     'value': 'hello'
    ...                 },
    ...                 'donk': {
    ...                     'value': False
    ...                 }
    ...             },
    ...             {
    ...                 'dink': {
    ...                     'value': 'goodbye'
    ...                 },
    ...                 'donk': {
    ...                     'value': True
    ...                 }
    ...             }
    ...         ]
    ...     }
    ... }
    >>> entry1.data['values'] = deepcopy(RECORD_VALUES)
    >>> entry2.data['values'] = deepcopy(RECORD_VALUES)
    >>> entry3.data['values'] = deepcopy(RECORD_VALUES)
    >>> del entry1.data['meta']
    >>> del entry2.data['meta']
    >>> del entry3.data['meta']

Discrepancies of simple fields should be spotted in the sub-records of a
recordList field::

    >>> entry3.data['values']['q_rec']['value'][0]['dink']['value'] = 'bonjour'
    >>> task.get_discrepancies(entries=entries)
    {'q_rec': {'0': {'dink': {'entry333': 'hello', 'entry444': 'hello', 'entry555': 'bonjour'}}}}
    >>> task.solve_discrepancies({}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_rec': {'value': [{'dink': {'value': 'hello', 'explanation': None, 'annotation': None}, 'donk': {'value': False, 'explanation': None, 'annotation': None}}, {'dink': {'value': 'goodbye', 'explanation': None, 'annotation': None}, 'donk': {'value': True, 'explanation': None, 'annotation': None}}]}}}
    >>> task.solve_discrepancies({'q_rec': {'0': {'dink': 'hi'}}}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_rec': {'value': [{'dink': {'value': 'hi', 'explanation': None, 'annotation': None}, 'donk': {'value': False, 'explanation': None, 'annotation': None}}, {'dink': {'value': 'goodbye', 'explanation': None, 'annotation': None}, 'donk': {'value': True, 'explanation': None, 'annotation': None}}]}}}

Discrepancies of mismatching records should be spotted and solved::

    >>> del entry3.data['values']['q_rec']['value'][0]
    >>> expected_discrepancies = {'q_rec': {'0': {'donk': {'entry444': False, 'entry333': False, 'entry555': True}, 'dink': {'entry444': 'hello', 'entry333': 'hello', 'entry555': 'goodbye'}, '_NEEDS_VALUE_': True}, '1': {'donk': {'entry444': True, 'entry333': True, 'entry555': None}, 'dink': {'entry444': 'goodbye', 'entry333': 'goodbye', 'entry555': None}, '_NEEDS_VALUE_': True}}}
    >>> task.get_discrepancies(entries=entries) == expected_discrepancies
    True
    >>> task.solve_discrepancies({}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_rec': {'value': [{'dink': {'value': 'hello', 'explanation': None, 'annotation': None}, 'donk': {'value': False, 'explanation': None, 'annotation': None}}, {'dink': {'value': 'goodbye', 'explanation': None, 'annotation': None}, 'donk': {'value': True, 'explanation': None, 'annotation': None}}]}}}
    >>> task.solve_discrepancies({'q_rec': {'1': {'dink': 'bye'}}}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_rec': {'value': [{'dink': {'value': 'hello', 'explanation': None, 'annotation': None}, 'donk': {'value': False, 'explanation': None, 'annotation': None}}, {'dink': {'value': 'bye', 'explanation': None, 'annotation': None}, 'donk': {'value': True, 'explanation': None, 'annotation': None}}]}}}

    >>> entry3.data['values']['q_rec']['value'] = None
    >>> expected_discrepancies = {'q_rec': {'1': {'donk': {'entry444': True, 'entry333': True, 'entry555': None}, 'dink': {'entry444': 'goodbye', 'entry333': 'goodbye', 'entry555': None}, '_NEEDS_VALUE_': True}, '0': {'donk': {'entry444': False, 'entry333': False, 'entry555': None}, 'dink': {'entry444': 'hello', 'entry333': 'hello', 'entry555': None}, '_NEEDS_VALUE_': True}}}
    >>> task.get_discrepancies(entries=entries) == expected_discrepancies
    True
    >>> task.solve_discrepancies({}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_rec': {'value': [{'dink': {'value': 'hello', 'explanation': None, 'annotation': None}, 'donk': {'value': False, 'explanation': None, 'annotation': None}}, {'dink': {'value': 'goodbye', 'explanation': None, 'annotation': None}, 'donk': {'value': True, 'explanation': None, 'annotation': None}}]}}}
    >>> task.solve_discrepancies({'q_rec': {'1': {'dink': 'bye'}}}, entries=entries)
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'values': {'q_rec': {'value': [{'dink': {'value': 'hello', 'explanation': None, 'annotation': None}, 'donk': {'value': False, 'explanation': None, 'annotation': None}}, {'dink': {'value': 'bye', 'explanation': None, 'annotation': None}, 'donk': {'value': True, 'explanation': None, 'annotation': None}}]}}}

Set up tests with matrix fields::

    >>> del iv.definition['record'][0]
    >>> iv.definition['record'].append({
    ...     'id': 'q_matrix',
    ...     'type': {
    ...         'base': 'matrix',
    ...         'columns': [
    ...             {
    ...                 'id': 'doo',
    ...                 'type': 'float'
    ...             },
    ...             {
    ...                 'id': 'dah',
    ...                 'type': 'text'
    ...             }
    ...         ],
    ...         'rows': [
    ...             {
    ...                 'id': 'row1'
    ...             },
    ...             {
    ...                 'id': 'row2'
    ...             }
    ...         ]
    ...     }
    ... })
    >>> MATRIX_VALUES = {
    ...     'q_matrix': {
    ...         'value': {
    ...             'row1': {
    ...                 'doo': {
    ...                     'value': 42.1
    ...                 },
    ...                 'dah': {
    ...                     'value': 'hello'
    ...                 }
    ...             },
    ...             'row2': {
    ...                 'doo': {
    ...                     'value': 63
    ...                 },
    ...                 'dah': {
    ...                     'value': 'goodbye'
    ...                 }
    ...             }
    ...         }
    ...     }
    ... }
    >>> entry1.data['values'] = deepcopy(MATRIX_VALUES)
    >>> entry2.data['values'] = deepcopy(MATRIX_VALUES)
    >>> entry3.data['values'] = deepcopy(MATRIX_VALUES)

Discrepancies of simple fields within the depths of a matrix should be spotted
and solved::

    >>> entry3.data['values']['q_matrix']['value']['row1']['dah']['value'] = 'hi'
    >>> task.get_discrepancies(entries=entries)
    {'q_matrix': {'row1': {'dah': {'entry333': 'hello', 'entry444': 'hello', 'entry555': 'hi'}}}}
    >>> expected_solution = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'values': {'q_matrix': {'value': {'row1': {'dah': {'explanation': None, 'annotation': None, 'value': 'hello'}, 'doo': {'explanation': None, 'annotation': None, 'value': 42.1}}, 'row2': {'dah': {'explanation': None, 'annotation': None, 'value': 'goodbye'}, 'doo': {'explanation': None, 'annotation': None, 'value': 63}}}}}}
    >>> task.solve_discrepancies({}, entries=entries) == expected_solution
    True
    >>> expected_solution = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'values': {'q_matrix': {'value': {'row1': {'dah': {'explanation': None, 'annotation': None, 'value': 'hey'}, 'doo': {'explanation': None, 'annotation': None, 'value': 42.1}}, 'row2': {'dah': {'explanation': None, 'annotation': None, 'value': 'goodbye'}, 'doo': {'explanation': None, 'annotation': None, 'value': 63}}}}}}
    >>> task.solve_discrepancies({'q_matrix': {'row1': {'dah': 'hey'}}}, entries=entries) == expected_solution
    True

    >>> entry3.data['values']['q_matrix']['value'] = None
    >>> task.get_discrepancies(entries=entries)
    {'q_matrix': {'row1': {'doo': {'entry333': 42.1, 'entry444': 42.1, 'entry555': None}, 'dah': {'entry333': 'hello', 'entry444': 'hello', 'entry555': None}}, 'row2': {'doo': {'entry333': 63, 'entry444': 63, 'entry555': None}, 'dah': {'entry333': 'goodbye', 'entry444': 'goodbye', 'entry555': None}}}}
    >>> expected_solution = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'values': {'q_matrix': {'value': {'row1': {'dah': {'explanation': None, 'annotation': None, 'value': 'hello'}, 'doo': {'explanation': None, 'annotation': None, 'value': 42.1}}, 'row2': {'dah': {'explanation': None, 'annotation': None, 'value': 'goodbye'}, 'doo': {'explanation': None, 'annotation': None, 'value': 63}}}}}}
    >>> task.solve_discrepancies({}, entries=entries) == expected_solution
    True
    >>> expected_solution = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'values': {'q_matrix': {'value': {'row1': {'dah': {'explanation': None, 'annotation': None, 'value': 'hey'}, 'doo': {'explanation': None, 'annotation': None, 'value': 42.1}}, 'row2': {'dah': {'explanation': None, 'annotation': None, 'value': 'goodbye'}, 'doo': {'explanation': None, 'annotation': None, 'value': 63}}}}}}
    >>> task.solve_discrepancies({'q_matrix': {'row1': {'dah': 'hey'}}}, entries=entries) == expected_solution
    True

    >>> entry1.data['values']['q_matrix']['value'] = None
    >>> entry2.data['values']['q_matrix']['value'] = None
    >>> task.get_discrepancies(entries=entries)
    {}
    >>> expected_solution = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'values': {'q_matrix': {'value': {'row1': {'dah': {'explanation': None, 'annotation': None, 'value': None}, 'doo': {'explanation': None, 'annotation': None, 'value': None}}, 'row2': {'dah': {'explanation': None, 'annotation': None, 'value': None}, 'doo': {'explanation': None, 'annotation': None, 'value': None}}}}}}
    >>> task.solve_discrepancies({}, entries=entries) == expected_solution
    True


When all updates are complete, close out the Task (and associated Assessment)
by using the ``reconcile()`` method::

    >>> from rex.instrument_demo import DemoTask
    >>> task = DemoTask.get_by_uid('task4')
    >>> task.reconcile(user)
    ### SAVED ENTRY fake_entry_1
    ### SAVED ASSESSMENT assessment5
    ### SAVED TASK task4
    >>> task.assessment.status == Assessment.STATUS_COMPLETE
    True
    >>> task.status == Task.STATUS_COMPLETE
    True
    >>> task.is_done
    True
    >>> task.can_enter_data
    False
    >>> task.can_reconcile
    False

    >>> task.reconcile(user)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: This Task cannot be reconciled in its current state.
    >>> task.start_entry(user)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.InstrumentError: This Task does not allow an additional Preliminary Entry.

    >>> task = DemoTask.get_by_uid('task7')
    >>> task.assessment.status = Assessment.STATUS_IN_PROGRESS
    >>> task.reconcile(user)
    ### SAVED ENTRY fake_entry_1
    ### SAVED ASSESSMENT assessment8
    ### SAVED ASSESSMENT assessment8
    ### CREATED RECORDSET assessment8 {'calc1': 'yo, goodbye, 1', 'calc2': 'yo, goodbye, 1', 'calc3': 2.23, 'calc4': True, 'calc5': True, 'calc6': '42, Not Red, White, completed, myenum'}
    ### SAVED TASK task7
    >>> task.assessment.status == Assessment.STATUS_COMPLETE
    True
    >>> task.status == Task.STATUS_COMPLETE
    True
    >>> task.is_done
    True
    >>> task.can_enter_data
    False
    >>> task.can_reconcile
    False

Tasks can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> task1 = Task('bar888', subject, instrument, 100, assessment)
    >>> task2 = Task('bar999', subject, instrument, 100, assessment)
    >>> task3 = Task('bar888', subject, instrument, 345)
    >>> task1 == task2
    False
    >>> task1 == task3
    True
    >>> task1 != task2
    True
    >>> task1 != task3
    False
    >>> mylist = [task1]
    >>> task1 in mylist
    True
    >>> task2 in mylist
    False
    >>> task3 in mylist
    True
    >>> myset = set(mylist)
    >>> task1 in myset
    True
    >>> task2 in myset
    False
    >>> task3 in myset
    True

    >>> task1 < task2
    True
    >>> task1 <= task3
    True
    >>> task2 > task1
    True
    >>> task3 >= task1
    True


