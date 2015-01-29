*******
Channel
*******


The semi-abstract base Channel class only implements a simple constructor and
string-rendering methods::

    >>> from rex.forms.interface import Channel
    >>> channel = Channel('fake123', 'My EDC Application')
    >>> channel.get_display_name()
    u'My EDC Application'
    >>> unicode(channel)
    u'My EDC Application'
    >>> str(channel)
    'My EDC Application'
    >>> repr(channel)
    "Channel(u'fake123', u'My EDC Application')"

    >>> channel.as_dict()
    {'uid': u'fake123', 'title': u'My EDC Application'}
    >>> channel.as_json()
    u'{"uid": "fake123", "title": "My EDC Application"}'


Channels can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> channel1 = Channel('fake123', 'My EDC Application')
    >>> channel2 = Channel('fake456', 'My EDC Application')
    >>> channel3 = Channel('fake123', 'My Other EDC Application')
    >>> channel1 == channel2
    False
    >>> channel1 == channel3
    True
    >>> channel1 != channel2
    True
    >>> channel1 != channel3
    False
    >>> mylist = [channel1]
    >>> channel1 in mylist
    True
    >>> channel2 in mylist
    False
    >>> channel3 in mylist
    True
    >>> myset = set(mylist)
    >>> channel1 in myset
    True
    >>> channel2 in myset
    False
    >>> channel3 in myset
    True

    >>> channel1 < channel2
    True
    >>> channel1 <= channel3
    True
    >>> channel2 > channel1
    True
    >>> channel3 >= channel1
    True

