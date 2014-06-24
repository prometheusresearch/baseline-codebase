**********
Instrument
**********

.. contents:: Table of Contents


The semi-abstract base Instrument class only implements a simple constructor
and string-rendering methods::

    >>> from rex.instrument.interface import Instrument
    >>> instrument = Instrument('fake123', 'My Instrument Title')
    >>> instrument.get_display_name()
    u'My Instrument Title'
    >>> unicode(instrument)
    u'My Instrument Title'
    >>> str(instrument)
    'My Instrument Title'
    >>> repr(instrument)
    "Instrument(u'fake123', u'My Instrument Title')"

    >>> instrument.as_dict()
    {'uid': u'fake123', 'title': u'My Instrument Title'}
    >>> instrument.as_json()
    u'{"uid": "fake123", "title": "My Instrument Title"}'


Instruments can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> instrument1 = Instrument('fake123', 'My Instrument Title')
    >>> instrument2 = Instrument('fake456', 'My Instrument Title')
    >>> instrument3 = Instrument('fake123', 'My Other Instrument Title')
    >>> instrument1 == instrument2
    False
    >>> instrument1 == instrument3
    True
    >>> instrument1 != instrument2
    True
    >>> instrument1 != instrument3
    False
    >>> mylist = [instrument1]
    >>> instrument1 in mylist
    True
    >>> instrument2 in mylist
    False
    >>> instrument3 in mylist
    True
    >>> myset = set(mylist)
    >>> instrument1 in myset
    True
    >>> instrument2 in myset
    False
    >>> instrument3 in myset
    True

    >>> instrument1 < instrument2
    True
    >>> instrument1 <= instrument3
    True
    >>> instrument2 > instrument1
    True
    >>> instrument3 >= instrument1
    True

