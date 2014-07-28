*****************
InstrumentVersion
*****************

.. contents:: Table of Contents


InstrumentVersion
=================

The semi-abstract base InstrumentVersion class only implements a simple
constructor and string-rendering methods::

    >>> from rex.instrument.interface import Instrument, InstrumentVersion
    >>> from datetime import datetime
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
    >>> iv = InstrumentVersion('notreal456', instrument, INSTRUMENT, 1, 'jay', datetime(2014, 5, 22))
    >>> iv.get_display_name()
    u'The InstrumentVersion Title'
    >>> unicode(iv)
    u'The InstrumentVersion Title'
    >>> str(iv)
    'The InstrumentVersion Title'
    >>> repr(iv)
    "InstrumentVersion(u'notreal456', Instrument(u'fake123', u'My Instrument Title'), 1)"

    >>> iv.as_dict()
    {'instrument': {'status': u'active', 'uid': u'fake123', 'title': u'My Instrument Title'}, 'published_by': u'jay', 'version': 1, 'uid': u'notreal456', 'date_published': datetime.datetime(2014, 5, 22, 0, 0)}
    >>> iv.as_json()
    u'{"instrument": {"status": "active", "uid": "fake123", "title": "My Instrument Title"}, "published_by": "jay", "version": 1, "uid": "notreal456", "date_published": "2014-05-22T00:00:00"}'


The Instruments passed to the constructor must actually be an Instrument
instance or a string containing a UID::

    >>> iv = InstrumentVersion('notreal456', object(), {}, 1, 'jay', datetime(2014, 5, 22))
    Traceback (most recent call last):
      ...
    ValueError: instrument must be an instance of Instrument or a UID of one


The definition can be passed to the contructor as either a JSON-encoded string
or the dict equivalent::

    >>> iv = InstrumentVersion('notreal456', instrument, '{"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}', 1, 'jay', datetime(2014, 5, 22))
    >>> iv.validate()


The definition can be set or retrieved as either a JSON-encoded string, or a
dict equivalent::

    >>> iv.definition_json
    u'{"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The InstrumentVersion Title"}'
    >>> iv.definition_json = u'{"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "A Different Title"}'

    >>> iv.definition
    {u'record': [{u'type': u'text', u'id': u'q_fake'}], u'version': u'1.1', u'id': u'urn:test-instrument', u'title': u'A Different Title'}
    >>> iv.definition = {u'record': [{u'type': u'text', u'id': u'q_foo'}], u'version': u'1.1', u'id': u'urn:test-instrument', u'title': u'A Different Title'}


Entries have date_modified, modified_by, status, and memo properties which are
both readable and writable::

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
    u'bob'
    >>> iv.published_by = 'jay'
    >>> iv.published_by
    u'jay'


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

