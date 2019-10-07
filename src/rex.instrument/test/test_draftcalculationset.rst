*******************
DraftCalculationSet
*******************


Set up the environment::

    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> rex = Rex('__main__', 'rex.demo.instrument')
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
    'foo789'
    >>> str(dcs)
    'foo789'
    >>> str(dcs)
    'foo789'
    >>> repr(dcs)
    "DraftCalculationSet('foo789', DraftInstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title')))"

    >>> dcs.as_dict()
    {'uid': 'foo789', 'draft_instrument_version': {'uid': 'notreal456', 'instrument': {'uid': 'fake123', 'title': 'My Instrument Title', 'code': 'fake123', 'status': 'active'}, 'parent_instrument_version': None, 'created_by': 'jay', 'date_created': datetime.datetime(2014, 5, 22, 0, 0), 'modified_by': 'jay', 'date_modified': datetime.datetime(2014, 5, 22, 0, 0)}}
    >>> dcs.as_json()
    '{"uid": "foo789", "draft_instrument_version": {"uid": "notreal456", "instrument": {"uid": "fake123", "title": "My Instrument Title", "code": "fake123", "status": "active"}, "parent_instrument_version": null, "created_by": "jay", "date_created": "2014-05-22T00:00:00", "modified_by": "jay", "date_modified": "2014-05-22T00:00:00"}}'


The DraftInstrumentVersions passed to the constructor must actually be
instances of those classes or strings containing UIDs::

    >>> dcs = DraftCalculationSet('foo789', object(), CALCULATIONSET)
    Traceback (most recent call last):
      ...
    ValueError: draft_instrument_version must be an instance of DraftInstrumentVersion or a UID of one

    >>> dcs = DraftCalculationSet('foo789', 'draftiv1', CALCULATIONSET)
    >>> dcs.draft_instrument_version
    DemoDraftInstrumentVersion('draftiv1', DemoInstrument('simple', 'Simple Instrument'))

    >>> iv = dcs.draft_instrument_version.instrument.latest_version
    >>> iv.definition['version'] = '1.3'
    >>> dcs.definition['instrument']
    {'id': 'urn:test-instrument', 'version': '1.1'}
    >>> calc = dcs.publish(iv)
    >>> calc
    DemoCalculationSet('fake_calculationset_1', DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1))
    >>> calc.definition['instrument']
    {'id': 'urn:test-instrument', 'version': '1.3'}


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
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'calculations': [{'id': 'uppercased', 'type': 'text', 'method': 'python', 'options': {'expression': "assessment['q_fake'].upper()"}}]}
    >>> dcs.definition = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'calculations': [{'method': 'python', 'type': 'text', 'options': {'expression': "assessment['q_fake'].upper()"}, 'id': 'uppercased_fake'}]}

    >>> dcs.definition_json
    '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "uppercased_fake", "type": "text", "method": "python", "options": {"expression": "assessment[\'q_fake\'].upper()"}}]}'
    >>> dcs.definition_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ncalculations:\n- id: uppercased_fake\n  type: text\n  method: python\n  options: {expression: 'assessment[''q_fake''].upper()'}"

    >>> dcs.definition_json = '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "calculations": [{"id": "lowercased", "type": "text", "method": "python", "options": {"expression": "assessment[\'q_fake\'].lower()"}}]}'
    >>> dcs.definition
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'calculations': [{'id': 'lowercased', 'type': 'text', 'method': 'python', 'options': {'expression': "assessment['q_fake'].lower()"}}]}

    >>> dcs.definition_yaml = "instrument: {id: 'urn:test-instrument', version: '1.1'}\ncalculations:\n- id: lowercased_fake\n  type: text\n  method: python\n  options: {expression: 'assessment[''q_fake''].lower()'}"
    >>> dcs.definition
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'calculations': [{'id': 'lowercased_fake', 'type': 'text', 'method': 'python', 'options': {'expression': "assessment['q_fake'].lower()"}}]}

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


