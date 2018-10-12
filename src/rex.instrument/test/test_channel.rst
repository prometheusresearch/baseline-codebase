*******
Channel
*******


The semi-abstract base Channel class only implements a simple constructor and
string-rendering methods::

    >>> from rex.instrument.interface import Channel
    >>> channel = Channel('fake123', 'My EDC Application', Channel.PRESENTATION_TYPE_FORM)
    >>> channel.get_display_name()
    'My EDC Application'
    >>> str(channel)
    'My EDC Application'
    >>> str(channel)
    'My EDC Application'
    >>> repr(channel)
    "Channel('fake123', 'My EDC Application', 'form')"

    >>> channel.as_dict()
    {'uid': 'fake123', 'title': 'My EDC Application', 'presentation_type': 'form'}
    >>> channel.as_json()
    '{"uid": "fake123", "title": "My EDC Application", "presentation_type": "form"}'


If you pass an invalid presentation_type, an error will be thrown::

    >>> channel = Channel('fake123', 'My EDC Application', 'foo')
    Traceback (most recent call last):
        ...
    ValueError: "foo" is not a valid presentation type


Channels can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> channel1 = Channel('fake123', 'My EDC Application', Channel.PRESENTATION_TYPE_FORM)
    >>> channel2 = Channel('fake456', 'My EDC Application', Channel.PRESENTATION_TYPE_FORM)
    >>> channel3 = Channel('fake123', 'My Other EDC Application', Channel.PRESENTATION_TYPE_FORM)
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


