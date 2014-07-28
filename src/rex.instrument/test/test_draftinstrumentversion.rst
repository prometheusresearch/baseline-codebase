**********************
DraftInstrumentVersion
**********************

.. contents:: Table of Contents


InstrumentVersion
=================

The semi-abstract base InstrumentVersion class only implements a simple
constructor and string-rendering methods::

    >>> from rex.instrument.interface import Instrument, InstrumentVersion, DraftInstrumentVersion
    >>> from datetime import datetime
    >>> instrument = Instrument('fake123', 'My Instrument Title')
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
    >>> unicode(div)
    u'The DraftInstrumentVersion Title'
    >>> str(div)
    'The DraftInstrumentVersion Title'
    >>> repr(div)
    "DraftInstrumentVersion(u'notreal456', Instrument(u'fake123', u'My Instrument Title'))"
    >>> div.definition = None
    >>> div.get_display_name()
    u'notreal456'

    >>> div.as_dict()
    {'modified_by': u'someguy', 'uid': u'notreal456', 'date_modified': datetime.datetime(2014, 5, 22, 0, 0), 'created_by': u'someguy', 'instrument': {'status': u'active', 'uid': u'fake123', 'title': u'My Instrument Title'}, 'date_created': datetime.datetime(2014, 5, 22, 0, 0), 'parent_instrument_version': None}
    >>> div.as_json()
    u'{"modified_by": "someguy", "uid": "notreal456", "date_modified": "2014-05-22T00:00:00", "created_by": "someguy", "instrument": {"status": "active", "uid": "fake123", "title": "My Instrument Title"}, "date_created": "2014-05-22T00:00:00", "parent_instrument_version": null}'


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


The definition can be passed to the contructor as either a JSON-encoded string
or the dict equivalent::

    >>> div = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 5, 22), definition='{"id": "urn:test-instrument", "version": "1.1", "title": "The DraftInstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}')
    >>> div.validate()


The definition can be set or retrieved as either a JSON-encoded string, or a
dict equivalent::

    >>> div.definition_json
    u'{"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The DraftInstrumentVersion Title"}'
    >>> div.definition_json = u'{"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "A Different Title"}'

    >>> div.definition
    {u'record': [{u'type': u'text', u'id': u'q_fake'}], u'version': u'1.1', u'id': u'urn:test-instrument', u'title': u'A Different Title'}
    >>> div.definition = {u'record': [{u'type': u'text', u'id': u'q_foo'}], u'version': u'1.1', u'id': u'urn:test-instrument', u'title': u'A Different Title'}

    >>> div.definition = None
    >>> div.definition is None
    True
    >>> div.definition_json is None
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
    >>> div.date_modified > datetime(2014, 6, 1)
    True


DraftInstrumentVersions can be checked for equality. Note that equality is only
defined as being the same class with the same UID::

    >>> div1 = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 05, 22))
    >>> div2 = DraftInstrumentVersion('notreal789', instrument, 'someguy', datetime(2014, 05, 22))
    >>> div3 = DraftInstrumentVersion('notreal456', instrument, 'someguy', datetime(2014, 05, 22))
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

