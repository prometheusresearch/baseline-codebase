**********************
DraftInstrumentVersion
**********************


Set up the environment::

    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> from pytz import utc
    >>> rex = Rex('__main__', 'rex.instrument_demo')
    >>> rex.on()


The semi-abstract base DraftInstrumentVersion class only implements a simple
constructor and string-rendering methods::

    >>> from rex.instrument.interface import Instrument, InstrumentVersion, DraftInstrumentVersion
    >>> from datetime import datetime
    >>> instrument = Instrument('fake123', 'fake123', 'My Instrument Title')
    >>> INSTRUMENT = {
    ...     'id': 'urn:test-instrument',
    ...     'version': '1.1',
    ...     'title': 'The DraftInstrumentVersion Title',
    ...     'record': [
    ...         {
    ...             'id': 'q_fake',
    ...             'type': 'text'
    ...         }
    ...     ]
    ... }

    >>> div = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 5, 22), definition=INSTRUMENT)
    >>> div.get_display_name()
    u'The DraftInstrumentVersion Title'
    >>> str(div)
    u'The DraftInstrumentVersion Title'
    >>> str(div)
    'The DraftInstrumentVersion Title'
    >>> repr(div)
    "DraftInstrumentVersion(u'notreal456', Instrument(u'fake123', u'My Instrument Title'))"
    >>> div.definition = None
    >>> div.get_display_name()
    u'notreal456'

    >>> div.as_dict()
    {'parent_instrument_version': None, 'modified_by': u'someguy', 'uid': u'notreal456', 'date_modified': datetime.datetime(2014, 5, 22, 0, 0), 'created_by': u'someguy', 'instrument': {'status': u'active', 'code': u'fake123', 'uid': u'fake123', 'title': u'My Instrument Title'}, 'date_created': datetime.datetime(2014, 5, 22, 0, 0)}
    >>> div.as_json()
    u'{"parent_instrument_version": null, "modified_by": "someguy", "uid": "notreal456", "date_modified": "2014-05-22T00:00:00", "created_by": "someguy", "instrument": {"status": "active", "code": "fake123", "uid": "fake123", "title": "My Instrument Title"}, "date_created": "2014-05-22T00:00:00"}'


The Instruments and InstrumentVersions passed to the constructor must actually
be an instance or a string containing a UID::

    >>> div = DraftInstrumentVersion('notreal456', object(), 'someguy', datetime(2014, 5, 22))
    Traceback (most recent call last):
      ...
    ValueError: instrument must be an instance of Instrument or a UID of one

    >>> div = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 5, 22), parent_instrument_version=object())
    Traceback (most recent call last):
      ...
    ValueError: parent_instrument_version must be an instance of InstrumentVersion or a UID of one

    >>> div = DraftInstrumentVersion('notreal456', 'simple', 'someguy', datetime(2014, 5, 2), definition=INSTRUMENT, parent_instrument_version='simple1')
    >>> div.instrument
    DemoInstrument(u'simple', u'Simple Instrument')
    >>> div.parent_instrument_version
    DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L)

    >>> from rex.instrument.util import get_implementation
    >>> div.definition['version']
    '1.1'
    >>> iv = div.publish(get_implementation('user').get_by_uid('user1'))
    >>> iv
    DemoInstrumentVersion(u'fake_instrument_version_1', DemoInstrument(u'simple', u'Simple Instrument'), 2L)
    >>> iv.definition['version']
    '1.2'


The definition can be passed to the contructor as either a JSON/YAML-encoded
string or the dict equivalent::

    >>> div = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 5, 22), definition='{"id": "urn:test-instrument", "version": "1.1", "title": "The DraftInstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}')
    >>> div.validate()

    >>> div = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 5, 22), definition="id: urn:test-instrument\nversion: '1.1'\ntitle: The DraftInstrumentVersion Title\nrecord:\n- {id: q_fake, type: text}")
    >>> div.validate()


The definition can be set or retrieved as either a JSON/YAML-encoded string, or
a dict equivalent::

    >>> div.definition_json
    '{"id": "urn:test-instrument", "version": "1.1", "title": "The DraftInstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}'
    >>> div.definition_yaml
    "id: urn:test-instrument\nversion: '1.1'\ntitle: The DraftInstrumentVersion Title\nrecord:\n- {id: q_fake, type: text}"

    >>> div.definition_json = '{"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "A Different Title"}'
    >>> div.definition
    {'record': [{'type': 'text', 'id': 'q_fake'}], 'version': '1.1', 'id': 'urn:test-instrument', 'title': 'A Different Title'}

    >>> div.definition_yaml = "id: urn:test-instrument\nversion: '1.1'\ntitle: A Third Title\nrecord:\n- {id: q_fake, type: text}"
    >>> div.definition
    {'record': [{'type': 'text', 'id': 'q_fake'}], 'version': '1.1', 'id': 'urn:test-instrument', 'title': 'A Third Title'}

    >>> div.definition = {'record': [{'type': 'text', 'id': 'q_fake'}], 'version': '1.1', 'id': 'urn:test-instrument', 'title': 'A Different Title'}
    >>> div.definition
    {'record': [{'type': 'text', 'id': 'q_fake'}], 'version': '1.1', 'id': 'urn:test-instrument', 'title': 'A Different Title'}

    >>> div.definition = None
    >>> div.definition is None
    True
    >>> div.definition_json is None
    True
    >>> div.definition_yaml is None
    True


DraftInstrumentVersions have date_modified and modified_by properties which are
both readable and writable::

    >>> div = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 5, 22))

    >>> div.date_modified
    datetime.datetime(2014, 5, 22, 0, 0)
    >>> div.date_modified = datetime(2014, 6, 1)
    >>> div.date_modified
    datetime.datetime(2014, 6, 1, 0, 0)
    >>> div.date_modified = '20140602'
    Traceback (most recent call last):
        ...
    ValueError: "20140602" is not a valid datetime
    >>> div.date_modified
    datetime.datetime(2014, 6, 1, 0, 0)

    >>> div.modified_by
    u'someguy'
    >>> div.modified_by = 'jay'
    >>> div.modified_by
    u'jay'

    >>> from rex.instrument.interface import User
    >>> user = User('fake123', 'someguy')
    >>> div.modify(user)
    >>> div.modified_by
    u'someguy'
    >>> div.date_modified > datetime(2014, 6, 1, tzinfo=utc)
    True


There's also a read-only property named ``calculation_set`` that is a reference
to the associated CalculationSet object, if there is one::

    >>> div.calculation_set is None
    True

    >>> div = DraftInstrumentVersion.get_implementation().get_by_uid('draftiv1')
    >>> div.calculation_set
    DemoDraftCalculationSet(u'draftiv1', DemoDraftInstrumentVersion(u'draftiv1', DemoInstrument(u'simple', u'Simple Instrument')))


DraftInstrumentVersions can be checked for equality. Note that equality is only
defined as being the same class with the same UID::

    >>> div1 = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 0o5, 22))
    >>> div2 = DraftInstrumentVersion('notreal789', instrument, 'someguy', datetime(2014, 0o5, 22))
    >>> div3 = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 0o5, 22))
    >>> div1 == div2
    False
    >>> div1 == div3
    True
    >>> div1 != div2
    True
    >>> div1 != div3
    False
    >>> mylist = [div1]
    >>> div1 in mylist
    True
    >>> div2 in mylist
    False
    >>> div3 in mylist
    True
    >>> myset = set(mylist)
    >>> div1 in myset
    True
    >>> div2 in myset
    False
    >>> div3 in myset
    True

    >>> div1 < div2
    True
    >>> div1 <= div3
    True
    >>> div2 > div1
    True
    >>> div3 >= div1
    True


