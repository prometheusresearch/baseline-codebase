****
User
****

.. contents:: Table of Contents


The semi-abstract base User class only implements a simple constructor and
string-rendering methods::

    >>> from rex.instrument.interface import User
    >>> user = User('fake123', 'username')
    >>> user.get_display_name()
    u'username'
    >>> unicode(user)
    u'username'
    >>> str(user)
    'username'
    >>> repr(user)
    "User(u'fake123', u'username')"

    >>> user.as_dict()
    {'login': u'username', 'uid': u'fake123'}
    >>> user.as_json()
    u'{"login": "username", "uid": "fake123"}'


Users can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> user1 = User('fake123', 'username')
    >>> user2 = User('fake456', 'foobar')
    >>> user3 = User('fake123', 'otheruser')
    >>> user1 == user2
    False
    >>> user1 == user3
    True
    >>> user1 != user2
    True
    >>> user1 != user3
    False
    >>> mylist = [user1]
    >>> user1 in mylist
    True
    >>> user2 in mylist
    False
    >>> user3 in mylist
    True
    >>> myset = set(mylist)
    >>> user1 in myset
    True
    >>> user2 in myset
    False
    >>> user3 in myset
    True

    >>> user1 < user2
    True
    >>> user1 <= user3
    True
    >>> user2 > user1
    True
    >>> user3 >= user1
    True

