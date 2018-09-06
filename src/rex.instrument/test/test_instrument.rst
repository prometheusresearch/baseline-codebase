**********
Instrument
**********


The semi-abstract base Instrument class only implements a simple constructor
and string-rendering methods::

    >>> from rex.instrument.interface import Instrument
    >>> instrument = Instrument('fake123', 'fake123', 'My Instrument Title')
    >>> instrument.get_display_name()
    'My Instrument Title'
    >>> str(instrument)
    'My Instrument Title'
    >>> str(instrument)
    'My Instrument Title'
    >>> repr(instrument)
    "Instrument('fake123', 'My Instrument Title')"

    >>> instrument.as_dict()
    {'uid': 'fake123', 'title': 'My Instrument Title', 'code': 'fake123', 'status': 'active'}
    >>> instrument.as_json()
    '{"uid": "fake123", "title": "My Instrument Title", "code": "fake123", "status": "active"}'


Instruments have a status property which is readable and writable::

    >>> instrument.status
    'active'
    >>> instrument.status = Instrument.STATUS_DISABLED
    >>> instrument.status
    'disabled'
    >>> instrument.status = 'something else'
    Traceback (most recent call last):
      ...
    ValueError: "something else" is not a valid Instrument status


Instruments can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> instrument1 = Instrument('fake123', 'fake123', 'My Instrument Title')
    >>> instrument2 = Instrument('fake456', 'fake456', 'My Instrument Title')
    >>> instrument3 = Instrument('fake123', 'fake123', 'My Other Instrument Title')
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


