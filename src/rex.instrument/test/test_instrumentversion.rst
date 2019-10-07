*****************
InstrumentVersion
*****************


Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> rex = Rex('__main__', 'rex.demo.instrument')
    >>> rex.on()


The semi-abstract base InstrumentVersion class only implements a simple
constructor and string-rendering methods::

    >>> from rex.instrument.interface import Instrument, InstrumentVersion
    >>> from datetime import datetime
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
    >>> iv.get_display_name()
    'The InstrumentVersion Title'
    >>> str(iv)
    'The InstrumentVersion Title'
    >>> str(iv)
    'The InstrumentVersion Title'
    >>> repr(iv)
    "InstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title'), 1)"

    >>> iv.as_dict()
    {'uid': 'notreal456', 'instrument': {'uid': 'fake123', 'title': 'My Instrument Title', 'code': 'fake123', 'status': 'active'}, 'version': 1, 'published_by': 'jay', 'date_published': datetime.datetime(2014, 5, 22, 0, 0)}
    >>> iv.as_dict(extra_properties=['definition'])
    {'uid': 'notreal456', 'instrument': {'uid': 'fake123', 'title': 'My Instrument Title', 'code': 'fake123', 'status': 'active'}, 'version': 1, 'published_by': 'jay', 'date_published': datetime.datetime(2014, 5, 22, 0, 0), 'definition': {'id': 'urn:test-instrument', 'version': '1.1', 'title': 'The InstrumentVersion Title', 'record': [{'id': 'q_fake', 'type': 'text'}]}}
    >>> iv.as_json()
    '{"uid": "notreal456", "instrument": {"uid": "fake123", "title": "My Instrument Title", "code": "fake123", "status": "active"}, "version": 1, "published_by": "jay", "date_published": "2014-05-22T00:00:00"}'


The Instruments passed to the constructor must actually be an Instrument
instance or a string containing a UID::

    >>> iv = InstrumentVersion('notreal456', object(), {}, 1, 'jay', datetime(2014, 5, 22))
    Traceback (most recent call last):
      ...
    ValueError: instrument must be an instance of Instrument or a UID of one

    >>> iv = InstrumentVersion('notreal456', 'simple', {}, 1, 'jay', datetime(2014, 5, 22))
    >>> iv.instrument
    DemoInstrument('simple', 'Simple Instrument')


The definition can be passed to the contructor as either a JSON/YAML-encoded
string or the dict equivalent::

    >>> iv = InstrumentVersion('notreal456', instrument, '{"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}', 1, 'jay', datetime(2014, 5, 22))
    >>> iv.validate()

    >>> iv = InstrumentVersion('notreal456', instrument, "id: urn:test-instrument\nversion: '1.1'\ntitle: The InstrumentVersion Title\nrecord:\n- {id: q_fake, type: text}", 1, 'jay', datetime(2014, 5, 22))
    >>> iv.validate()


The definition can be set or retrieved as either a JSON/YAML-encoded string, or
a dict equivalent::

    >>> iv.definition_json
    '{"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}'
    >>> iv.definition_yaml
    "id: urn:test-instrument\nversion: '1.1'\ntitle: The InstrumentVersion Title\nrecord:\n- {id: q_fake, type: text}"

    >>> iv.definition_json = '{"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "A Different Title"}'
    >>> iv.definition
    {'record': [{'type': 'text', 'id': 'q_fake'}], 'version': '1.1', 'id': 'urn:test-instrument', 'title': 'A Different Title'}

    >>> iv.definition_yaml = "id: urn:test-instrument\nversion: '1.1'\ntitle: A Third Title\nrecord:\n- {id: q_fake, type: text}"
    >>> iv.definition
    {'id': 'urn:test-instrument', 'version': '1.1', 'title': 'A Third Title', 'record': [{'id': 'q_fake', 'type': 'text'}]}

    >>> iv.definition = {'record': [{'type': 'text', 'id': 'q_fake'}], 'version': '1.1', 'id': 'urn:test-instrument', 'title': 'A Different Title'}
    >>> iv.definition
    {'record': [{'type': 'text', 'id': 'q_fake'}], 'version': '1.1', 'id': 'urn:test-instrument', 'title': 'A Different Title'}


InstrumentVersions have date_modified, modified_by, status, and memo properties
which are both readable and writable::

    >>> iv = InstrumentVersion('notreal456', instrument, INSTRUMENT, 1, 'bob', datetime(2014, 5, 22))

    >>> iv.date_published
    datetime.datetime(2014, 5, 22, 0, 0)
    >>> iv.date_published = datetime(2014, 6, 1)
    >>> iv.date_published
    datetime.datetime(2014, 6, 1, 0, 0)
    >>> iv.date_published = '20140602'
    Traceback (most recent call last):
        ...
    ValueError: "20140602" is not a valid datetime
    >>> iv.date_published
    datetime.datetime(2014, 6, 1, 0, 0)

    >>> iv.published_by
    'bob'
    >>> iv.published_by = 'jay'
    >>> iv.published_by
    'jay'


There's also a read-only property named ``calculation_set`` that is a reference
to the associated CalculationSet object, if there is one::

    >>> iv.calculation_set is None
    True

    >>> iv = InstrumentVersion.get_implementation().get_by_uid('calculation1')
    >>> iv.calculation_set
    DemoCalculationSet('calculation1', DemoInstrumentVersion('calculation1', DemoInstrument('calculation', 'Calculation Instrument'), 1))


There's a static method on InstrumentVersion named ``validate_definition()``
that will check the given structure against the RIOS specifications for
Instrument Definitions. It will raise an exception if the definition is not
well-formed::

    >>> INSTRUMENT_JSON = json.dumps(INSTRUMENT)
    >>> InstrumentVersion.validate_definition(INSTRUMENT)
    >>> InstrumentVersion.validate_definition(INSTRUMENT_JSON)

    >>> BAD_INSTRUMENT = deepcopy(INSTRUMENT)
    >>> del BAD_INSTRUMENT['title']
    >>> InstrumentVersion.validate_definition(BAD_INSTRUMENT)
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: The following problems were encountered when validating this Instrument:
    title: Required

    >>> InstrumentVersion.validate_definition('foo')
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Instrument Definitions must be mapped objects.

    >>> InstrumentVersion.validate_definition('{foo')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.instrument.errors.ValidationError: Invalid JSON/YAML provided: Failed to parse a YAML document:
        ...


There's a static method on InstrumentVersion named
``get_definition_type_catalog()`` that will return a dictionary that maps all
type names to their base Instrument Definition types::

    >>> InstrumentVersion.get_definition_type_catalog(INSTRUMENT)
    {'boolean': 'boolean', 'date': 'date', 'dateTime': 'dateTime', 'enumeration': 'enumeration', 'enumerationSet': 'enumerationSet', 'float': 'float', 'integer': 'integer', 'matrix': 'matrix', 'recordList': 'recordList', 'text': 'text', 'time': 'time'}
    >>> InstrumentVersion.get_definition_type_catalog(INSTRUMENT_JSON)
    {'boolean': 'boolean', 'date': 'date', 'dateTime': 'dateTime', 'enumeration': 'enumeration', 'enumerationSet': 'enumerationSet', 'float': 'float', 'integer': 'integer', 'matrix': 'matrix', 'recordList': 'recordList', 'text': 'text', 'time': 'time'}

    >>> InstrumentVersion.get_definition_type_catalog('foo')
    Traceback (most recent call last):
        ...
    TypeError: Instrument Definitions must be mapped objects.

    >>> InstrumentVersion.get_definition_type_catalog('{foo')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    ValueError: Invalid JSON/YAML provided: Failed to parse a YAML document:
        ...


There's a static method on InstrumentVersion named
``get_full_type_definition()`` that will return a dictionary containing the
full type definition for the given name or partial type definition::

    >>> InstrumentVersion.get_full_type_definition(INSTRUMENT, 'text')
    {'base': 'text'}
    >>> InstrumentVersion.get_full_type_definition(INSTRUMENT_JSON, 'text')
    {'base': 'text'}

    >>> InstrumentVersion.get_full_type_definition('foo', 'text')
    Traceback (most recent call last):
        ...
    TypeError: Instrument Definitions must be mapped objects.

    >>> InstrumentVersion.get_full_type_definition('{foo', 'text')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    ValueError: Invalid JSON/YAML provided: Failed to parse a YAML document:
        ...


InstrumentVersions can be checked for equality. Note that equality is only
defined as being the same class with the same UID::

    >>> iv1 = InstrumentVersion('notreal456', instrument, INSTRUMENT, 1, 'jay', datetime(2014, 5, 22))
    >>> iv2 = InstrumentVersion('notreal789', instrument, INSTRUMENT, 1, 'jay', datetime(2014, 5, 22))
    >>> iv3 = InstrumentVersion('notreal456', instrument, INSTRUMENT, 2, 'jay', datetime(2014, 5, 22))
    >>> iv1 == iv2
    False
    >>> iv1 == iv3
    True
    >>> iv1 != iv2
    True
    >>> iv1 != iv3
    False
    >>> mylist = [iv1]
    >>> iv1 in mylist
    True
    >>> iv2 in mylist
    False
    >>> iv3 in mylist
    True
    >>> myset = set(mylist)
    >>> iv1 in myset
    True
    >>> iv2 in myset
    False
    >>> iv3 in myset
    True

    >>> iv1 < iv2
    True
    >>> iv1 <= iv3
    True
    >>> iv2 > iv1
    True
    >>> iv3 >= iv1
    True


