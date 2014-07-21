*****************
InstrumentVersion
*****************

.. contents:: Table of Contents


InstrumentVersion
=================

The semi-abstract base InstrumentVersion class only implements a simple
constructor and string-rendering methods::

    >>> from rex.instrument.interface import Instrument, InstrumentVersion
    >>> instrument = Instrument('fake123', 'My Instrument Title')
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
    >>> iv = InstrumentVersion('notreal456', instrument, INSTRUMENT, 1)
    >>> iv.get_display_name()
    u'The InstrumentVersion Title'
    >>> unicode(iv)
    u'The InstrumentVersion Title'
    >>> str(iv)
    'The InstrumentVersion Title'
    >>> repr(iv)
    "InstrumentVersion(u'notreal456', Instrument(u'fake123', u'My Instrument Title'), 1)"

    >>> iv.as_dict()
    {'instrument': {'uid': u'fake123', 'title': u'My Instrument Title'}, 'version': 1, 'uid': u'notreal456'}
    >>> iv.as_json()
    u'{"instrument": {"uid": "fake123", "title": "My Instrument Title"}, "version": 1, "uid": "notreal456"}'


The Instruments passed to the constructor must actually be an Instrument
instance or a string containing a UID::

    >>> iv = InstrumentVersion('notreal456', object(), {}, 1)
    Traceback (most recent call last):
      ...
    ValueError: instrument must be an instance of Instrument or a UID of one


The definition can be passed to the contructor as either a JSON-encoded string
or the dict equivalent::

    >>> iv = InstrumentVersion('notreal456', instrument, '{"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}', 1)
    >>> iv.validate()


The definition can be retrieved as either a JSON-encoded string, or a dict
equivalent::

    >>> iv.definition_json
    u'{"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The InstrumentVersion Title"}'
    >>> iv.definition
    {u'record': [{u'type': u'text', u'id': u'q_fake'}], u'version': u'1.1', u'id': u'urn:test-instrument', u'title': u'The InstrumentVersion Title'}


InstrumentVersions can be checked for equality. Note that equality is only
defined as being the same class with the same UID::

    >>> iv1 = InstrumentVersion('notreal456', instrument, INSTRUMENT, 1)
    >>> iv2 = InstrumentVersion('notreal789', instrument, INSTRUMENT, 1)
    >>> iv3 = InstrumentVersion('notreal456', instrument, INSTRUMENT, 2)
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

