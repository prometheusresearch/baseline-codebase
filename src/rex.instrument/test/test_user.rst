****
User
****


Set up the environment::

    >>> from rex.core import Rex
    >>> from rex.instrument.interface import User
    >>> from rex.instrument.util import get_implementation


The semi-abstract base User class only implements a simple constructor and
string-rendering methods::

    >>> user = User('fake123', 'username')
    >>> user.get_display_name()
    u'username'
    >>> str(user)
    u'username'
    >>> str(user)
    'username'
    >>> repr(user)
    "User(u'fake123', u'username')"

    >>> user.as_dict()
    {'login': u'username', 'uid': u'fake123'}
    >>> user.as_json()
    u'{"login": "username", "uid": "fake123"}'


Users have methods that allow you to retrieve other interface objects, but
filtered by what that User has access to see::

    >>> rex = Rex('rex.instrument_demo', db='pgsql:instrument_demo')
    >>> rex.on()

    >>> user = get_implementation('user').get_by_uid('user1')
    >>> user.get_object_by_uid('simple', 'instrument')
    DemoInstrument(u'simple', u'Simple Instrument')

    >>> user.find_objects('assessment')
    [DemoAssessment(u'assessment1', DemoSubject(u'subject1'), DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L)), DemoAssessment(u'assessment2', DemoSubject(u'subject1'), DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L)), DemoAssessment(u'assessment3', DemoSubject(u'subject1'), DemoInstrumentVersion(u'disabled1', DemoInstrument(u'disabled', u'Disabled Instrument'), 1L)), DemoAssessment(u'assessment4', DemoSubject(u'subject1'), DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L)), DemoAssessment(u'assessment5', DemoSubject(u'subject1'), DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L)), DemoAssessment(u'assessment6', DemoSubject(u'subject1'), DemoInstrumentVersion(u'disabled1', DemoInstrument(u'disabled', u'Disabled Instrument'), 1L)), DemoAssessment(u'assessment7', DemoSubject(u'subject1'), DemoInstrumentVersion(u'disabled1', DemoInstrument(u'disabled', u'Disabled Instrument'), 1L)), DemoAssessment(u'assessment8', DemoSubject(u'subject1'), DemoInstrumentVersion(u'calculation2', DemoInstrument(u'calculation-complex', u'Calculation Instrument'), 1L)), DemoAssessment(u'assessment9', DemoSubject(u'subject1'), DemoInstrumentVersion(u'calculation1', DemoInstrument(u'calculation', u'Calculation Instrument'), 1L))]

    >>> rex.off()


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


