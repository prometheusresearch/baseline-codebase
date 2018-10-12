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
    'username'
    >>> str(user)
    'username'
    >>> str(user)
    'username'
    >>> repr(user)
    "User('fake123', 'username')"

    >>> user.as_dict()
    {'uid': 'fake123', 'login': 'username'}
    >>> user.as_json()
    '{"uid": "fake123", "login": "username"}'


Users have methods that allow you to retrieve other interface objects, but
filtered by what that User has access to see::

    >>> rex = Rex('rex.instrument_demo', db='pgsql:instrument_demo')
    >>> rex.on()

    >>> user = get_implementation('user').get_by_uid('user1')
    >>> user.get_object_by_uid('simple', 'instrument')
    DemoInstrument('simple', 'Simple Instrument')

    >>> user.find_objects('assessment')
    [DemoAssessment('assessment1', DemoSubject('subject1'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1)), DemoAssessment('assessment2', DemoSubject('subject1'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1)), DemoAssessment('assessment3', DemoSubject('subject1'), DemoInstrumentVersion('disabled1', DemoInstrument('disabled', 'Disabled Instrument'), 1)), DemoAssessment('assessment4', DemoSubject('subject1'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1)), DemoAssessment('assessment5', DemoSubject('subject1'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1)), DemoAssessment('assessment6', DemoSubject('subject1'), DemoInstrumentVersion('disabled1', DemoInstrument('disabled', 'Disabled Instrument'), 1)), DemoAssessment('assessment7', DemoSubject('subject1'), DemoInstrumentVersion('disabled1', DemoInstrument('disabled', 'Disabled Instrument'), 1)), DemoAssessment('assessment8', DemoSubject('subject1'), DemoInstrumentVersion('calculation2', DemoInstrument('calculation-complex', 'Calculation Instrument'), 1)), DemoAssessment('assessment9', DemoSubject('subject1'), DemoInstrumentVersion('calculation1', DemoInstrument('calculation', 'Calculation Instrument'), 1))]

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


