*********
ResultSet
*********


Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> rex = Rex('__main__', 'rex.demo.instrument')
    >>> rex.on()


The semi-abstract base Assessment class only implements a simple constructor
and string-rendering methods::

    >>> from rex.instrument.interface import User, Subject, Instrument, InstrumentVersion, Assessment, ResultSet
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

The semi-abstract base ResultSet class only implements a simple constructor
and string-rendering methods::

    >>> assessment = Assessment('fake123', subject, iv, ASSESSMENT)
    >>> resultset = ResultSet('fake_result123', 'fake123', {'calc1': '1'})
    >>> resultset = ResultSet('fake_result123', assessment.uid, {'calc1': '1'})
    >>> resultset = ResultSet('fake_result123', assessment.data_json, {'calc1': '1'})
    >>> resultset = ResultSet('fake_result123', assessment, json.dumps({'calc1': '1'}))

    >>> resultset = ResultSet('fake_result123', object(), {'calc1': '1'})
    Traceback (most recent call last):
        ...
    ValueError: assessment must be an instance of Assessment or a UID of one

    >>> resultset = ResultSet('fake_result123', assessment.data, {'calc1': '1'})
    Traceback (most recent call last):
        ...
    ValueError: assessment must be an instance of Assessment or a UID of one


    >>> resultset.get_display_name()
    'fake_result123'

    >>> assessment1 = Assessment('fake123', subject, iv, ASSESSMENT)
    >>> resultset1 = ResultSet('fake_result123', assessment1, json.dumps({'calc1': '1'}))

    >>> assessment2 = Assessment('fake456', subject, iv, ASSESSMENT)
    >>> resultset2 = ResultSet('fake_result456', assessment, json.dumps({'calc12': '12'}))

    >>> resultset1 == resultset2
    False

ResultSet has read-only properties assessment and results::

    >>> resultset1.assessment
    Assessment('fake123', Subject('subject1'), InstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title'), 1))

    >>> resultset1.assessment = assessment2
    Traceback (most recent call last):
        ...
    AttributeError: can't set attribute

    >>> resultset1.results
    {'calc1': '1'}

    >>> resultset1.results = {'calc12': '12'}
    Traceback (most recent call last):
        ...
    AttributeError: can't set attribute

