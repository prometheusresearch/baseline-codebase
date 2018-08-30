*******************
DraftCalculationSet
*******************


Set up the environment::

    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> rex = Rex('__main__', 'rex.instrument_demo')
    >>> rex.on()


The semi-abstract base DraftCalculationSet class only implements a simple
constructor and string-rendering methods::

    >>> from rex.instrument import Instrument, DraftInstrumentVersion, DraftCalculationSet
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
    >>> div = DraftInstrumentVersion('notreal456', instrument, 'jay', datetime(2014, 5, 22), definition=INSTRUMENT)
    >>> CALCULATIONSET = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1',
    ...     },
    ...     'calculations': [
    ...         {
    ...             'id': 'uppercased',
    ...             'type': 'text',
    ...             'method': 'python',
    ...             'options': {
    ...                 'expression': "assessment['q_fake'].upper()"
    ...             }
    ...         }
    ...     ]
    ... }

    >>> dcs = DraftCalculationSet('foo789', div, CALCULATIONSET)
    >>> dcs.get_display_name()
    u'foo789'
    >>> str(dcs)
    u'foo789'
    >>> str(dcs)
    'foo789'
    >>> repr(dcs)
    "DraftCalculationSet(u'foo789', DraftInstrumentVersion(u'notreal456', Instrument(u'fake123', u'My Instrument Title')))"

    >>> dcs.as_dict()
    {'uid': u'foo789', 'draft_instrument_version': {'parent_instrument_version': None, 'modified_by': u'jay', 'uid': u'notreal456', 'date_modified': datetime.datetime(2014, 5, 22, 0, 0), 'created_by': u'jay', 'instrument': {'status': u'active', 'code': u'fake123', 'uid': u'fake123', 'title': u'My Instrument Title'}, 'date_created': datetime.datetime(2014, 5, 22, 0, 0)}}
    >>> dcs.as_json()
    u'{"uid": "foo789", "draft_instrument_version": {"parent_instrument_version": null, "modified_by": "jay", "uid": "notreal456", "date_modified": "2014-05-22T00:00:00", "created_by": "jay", "instrument": {"status": "active", "code": "fake123", "uid": "fake123", "title": "My Instrument Title"}, "date_created": "2014-05-22T00:00:00"}}'


The DraftInstrumentVersions passed to the constructor must actually be
instances of those classes or strings containing UIDs::

    >>> dcs = DraftCalculationSet('foo789', object(), CALCULATIONSET)
    Traceback (most recent call last):
      ...
    ValueError: draft_instrument_version must be an instance of DraftInstrumentVersion or a UID of one

    >>> dcs = DraftCalculationSet('foo789', 'draftiv1', CALCULATIONSET)
    >>> dcs.draft_instrument_version
    DemoDraftInstrumentVersion(u'draftiv1', DemoInstrument(u'simple', u'Simple Instrument'))

    >>> iv = dcs.draft_instrument_version.instrument.latest_version
    >>> iv.definition['version'] = '1.3'
    >>> dcs.definition['instrument']
    {'version': '1.1', 'id': 'urn:test-instrument'}
    >>> calc = dcs.publish(iv)
    >>> calc
    DemoCalculationSet(u'fake_calculationset_1', DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L))
    >>> calc.definition['instrument']
    {'version': '1.3', 'id': 'urn:test-instrument'}


The definition can be passed to the contructor as either a JSON/YAML-encoded
string or the dict equivalent::

    >>> from rex.instrument.output import dump_calculationset_json, dump_calculationset_yaml
    >>> dcs = DraftCalculationSet('foo789', div, dump_calculationset_json(CALCULATIONSET))
    >>> dcs.validate()
    >>> dcs = DraftCalculationSet('foo789', div, dump_calculationset_yaml(CALCULATIONSET))
    >>> dcs.validate()


The definition can be set or retrieved as either a JSON/YAML-encoded string
or a dict equivalent::

    >>> dcs.definition
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'calculations': [{'method': 'python', 'type': 'text', 'options': {'expression': "assessment['q_fake'].upper()"}, 'id': 'uppercased'}]}
    >>> dcs.definition = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'calculations': [{'method': 'python', 'type': 'text', 'options': {'expression': "assessment['q_fake'].upper()"}, 'id': 'uppercased_fake'}]}

    >>> dcs.definition_json
    '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "uppercased_fake", "type": "text", "method": "python", "options": {"expression": "assessment[\'q_fake\'].upper()"}}]}'
    >>> dcs.definition_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ncalculations:\n- id: uppercased_fake\n  type: text\n  method: python\n  options: {expression: 'assessment[''q_fake''].upper()'}"

    >>> dcs.definition_json = '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "lowercased", "type": "text", "method": "python", "options": {"expression": "assessment[\'q_fake\'].lower()"}}]}'
    >>> dcs.definition
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'calculations': [{'id': 'lowercased', 'type': 'text', 'method': 'python', 'options': {'expression': "assessment['q_fake'].lower()"}}]}

    >>> dcs.definition_yaml = "instrument: {id: 'urn:test-instrument', version: '1.1'}\ncalculations:\n- id: lowercased_fake\n  type: text\n  method: python\n  options: {expression: 'assessment[''q_fake''].lower()'}"
    >>> dcs.definition
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'calculations': [{'id': 'lowercased_fake', 'type': 'text', 'method': 'python', 'options': {'expression': "assessment['q_fake'].lower()"}}]}

    >>> dcs.definition = None
    >>> dcs.definition is None
    True
    >>> dcs.definition_json is None
    True
    >>> dcs.definition_yaml is None
    True


DraftCalculations can be checked for equality. Note that equality is only
defined as being the same class with the same UID::

    >>> calc1 = DraftCalculationSet('foo789', div, CALCULATIONSET)
    >>> calc2 = DraftCalculationSet('foo999', div, CALCULATIONSET)
    >>> calc3 = DraftCalculationSet('foo789', div, CALCULATIONSET)
    >>> calc1 == calc2
    False
    >>> calc1 == calc3
    True
    >>> calc1 != calc2
    True
    >>> calc1 != calc3
    False
    >>> mylist = [calc1]
    >>> calc1 in mylist
    True
    >>> calc2 in mylist
    False
    >>> calc3 in mylist
    True
    >>> myset = set(mylist)
    >>> calc1 in myset
    True
    >>> calc2 in myset
    False
    >>> calc3 in myset
    True

    >>> calc1 < calc2
    True
    >>> calc1 <= calc3
    True
    >>> calc2 > calc1
    True
    >>> calc3 >= calc1
    True


