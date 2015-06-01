***********
Interaction
***********


Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> rex = Rex('__main__', 'rex.mobile_demo')
    >>> rex.on()


The semi-abstract base Interaction class only implements a simple constructor
and string-rendering methods::

    >>> from rex.instrument.interface import Instrument, InstrumentVersion, Channel
    >>> from datetime import datetime
    >>> instrument = Instrument('fake123', 'fake123', 'My Instrument Title')
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
    >>> from rex.mobile.interface import Interaction
    >>> channel = Channel('chan135', 'My EDC Application', Channel.PRESENTATION_TYPE_SMS)
    >>> INTERACTION = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1',
    ...     },
    ...     'defaultLocalization': 'en',
    ...     'steps': [
    ...         {
    ...             'type': 'question',
    ...             'options': {
    ...                 'fieldId': 'q_fake',
    ...                 'text': {
    ...                     'en': 'What is your favorite word?',
    ...                     'fr': u'Quel est votre mot préféré?'
    ...                 },
    ...             },
    ...         },
    ...     ],
    ... }
    >>> interaction = Interaction('foo789', channel, iv, INTERACTION)
    >>> interaction.get_display_name()
    u'The InstrumentVersion Title'
    >>> unicode(interaction)
    u'The InstrumentVersion Title'
    >>> str(interaction)
    'The InstrumentVersion Title'
    >>> repr(interaction)
    "Interaction(u'foo789', Channel(u'chan135', u'My EDC Application', u'sms'), InstrumentVersion(u'notreal456', Instrument(u'fake123', u'My Instrument Title'), 1))"

    >>> interaction.as_dict()
    {'instrument_version': {'instrument': {'status': u'active', 'code': u'fake123', 'uid': u'fake123', 'title': u'My Instrument Title'}, 'published_by': u'jay', 'version': 1, 'uid': u'notreal456', 'date_published': datetime.datetime(2014, 5, 22, 0, 0)}, 'uid': u'foo789', 'channel': {'uid': u'chan135', 'presentation_type': u'sms', 'title': u'My EDC Application'}}
    >>> interaction.as_json()
    u'{"instrument_version": {"instrument": {"status": "active", "code": "fake123", "uid": "fake123", "title": "My Instrument Title"}, "published_by": "jay", "version": 1, "uid": "notreal456", "date_published": "2014-05-22T00:00:00"}, "uid": "foo789", "channel": {"uid": "chan135", "presentation_type": "sms", "title": "My EDC Application"}}'


The Channels and InstrumentVersions passed to the constructor must actually be
instances of those classes or strings containing UIDs::

    >>> interaction = Interaction('foo789', object(), iv, INTERACTION)
    Traceback (most recent call last):
      ...
    ValueError: channel must be an instance of Channel or a UID of one
    >>> interaction = Interaction('foo789', channel, object(), INTERACTION)
    Traceback (most recent call last):
      ...
    ValueError: instrument_version must be an instance of InstrumentVersion or a UID of one

    >>> interaction = Interaction('foo789', 'survey', 'simple1', INTERACTION)
    >>> interaction.channel
    DemoChannel(u'survey', u'RexSurvey', u'form')
    >>> interaction.instrument_version
    DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1)


The configuration can be passed to the contructor as either a JSON/YAML-encoded
string or the dict equivalent::

    >>> from rex.mobile.output import dump_interaction_json, dump_interaction_yaml
    >>> interaction = Interaction('foo789', channel, iv, dump_interaction_json(INTERACTION))
    >>> interaction.validate()
    >>> interaction = Interaction('foo789', channel, iv, dump_interaction_yaml(INTERACTION))
    >>> interaction.validate()


The configuration can be set or retrieved as either a JSON/YAML-encoded string
or a dict equivalent::

    >>> interaction.configuration
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'steps': [{'type': 'question', 'options': {'text': {'fr': u'Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?', 'en': 'What is your favorite word?'}, 'fieldId': 'q_fake'}}]}
    >>> interaction.configuration = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'steps': [{'type': 'question', 'options': {'text': {'fr': u'Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?', 'en': 'What is your favorite NEW word?'}, 'fieldId': 'q_fake'}}]}

    >>> interaction.configuration_json
    u'{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "steps": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "What is your favorite NEW word?", "fr": "Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?"}}}]}'
    >>> interaction.configuration_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ndefaultLocalization: en\nsteps:\n- type: question\n  options:\n    fieldId: q_fake\n    text: {en: 'What is your favorite NEW word?', fr: 'Quel est votre mot pr\xc3\x83\xc2\xa9f\xc3\x83\xc2\xa9r\xc3\x83\xc2\xa9?'}"

    >>> interaction.configuration_json ='{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "steps": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "What is your favorite REALLY NEW word?", "fr": "Quel est votre mot pr\xc3\x83\xc2\xa9f\xc3\x83\xc2\xa9r\xc3\x83\xc2\xa9?"}}}]}' 
    >>> interaction.configuration
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'steps': [{'type': 'question', 'options': {'text': {'fr': u'Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?', 'en': 'What is your favorite REALLY NEW word?'}, 'fieldId': 'q_fake'}}]}

    >>> interaction.configuration_yaml ="instrument: {id: 'urn:test-instrument', version: '1.1'}\ndefaultLocalization: en\nsteps:\n- type: question\n  options:\n    fieldId: q_fake\n    text: {en: 'What is your favorite SORTOFNEW word?', fr: 'Quel est votre mot pr\xc3\x83\xc2\xa9f\xc3\x83\xc2\xa9r\xc3\x83\xc2\xa9?'}" 
    >>> interaction.configuration
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'steps': [{'type': 'question', 'options': {'text': {'fr': u'Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?', 'en': 'What is your favorite SORTOFNEW word?'}, 'fieldId': 'q_fake'}}]}


There is a static method on Interaction named ``validated_configuration()``
that will validate the specified configuration against the PRISMH
specifications. It will raise an exception if the configuration is not
well-formed::

    >>> INSTRUMENT_JSON = json.dumps(INSTRUMENT)
    >>> INTERACTION_JSON = json.dumps(INTERACTION)
    >>> Interaction.validate_configuration(INTERACTION)
    >>> Interaction.validate_configuration(INTERACTION_JSON)
    >>> Interaction.validate_configuration(INTERACTION, instrument_definition=INSTRUMENT)
    >>> Interaction.validate_configuration(INTERACTION, instrument_definition=INSTRUMENT_JSON)
    >>> Interaction.validate_configuration(INTERACTION_JSON, instrument_definition=INSTRUMENT)
    >>> Interaction.validate_configuration(INTERACTION_JSON, instrument_definition=INSTRUMENT_JSON)

    >>> BAD_INTERACTION = deepcopy(INTERACTION)
    >>> del BAD_INTERACTION['steps']
    >>> Interaction.validate_configuration(BAD_INTERACTION)
    Traceback (most recent call last):
        ...
    ValidationError: The following problems were encountered when validating this Interaction:
    steps: Required

    >>> Interaction.validate_configuration('foo')
    Traceback (most recent call last):
        ...
    ValidationError: Interaction Configurations must be mapped objects.

    >>> Interaction.validate_configuration('{foo')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    ValidationError: Invalid JSON/YAML provided: Failed to parse a YAML document:
        ...

    >>> Interaction.validate_configuration(INTERACTION, instrument_definition='foo')
    Traceback (most recent call last):
        ...
    ValidationError: Instrument Definitions must be mapped objects.

    >>> Interaction.validate_configuration(INTERACTION, instrument_definition='{foo')  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    ValidationError: Invalid Instrument JSON/YAML provided: Failed to parse a YAML document:
        ...

    >>> BAD_INSTRUMENT = deepcopy(INSTRUMENT)
    >>> BAD_INSTRUMENT['record'][0]['type'] = {
    ...     'base': 'enumerationSet',
    ...     'enumerations': {
    ...         'foo': {},
    ...         'bar': {},
    ...     },
    ... }
    >>> Interaction.validate_configuration(INTERACTION, instrument_definition=BAD_INSTRUMENT)
    Traceback (most recent call last):
        ...
    ValidationError: Fields of type enumerationSet are not currently supported.


Interactions can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> interaction1 = Interaction('foo789', channel, iv, INTERACTION)
    >>> interaction2 = Interaction('foo999', channel, iv, INTERACTION)
    >>> interaction3 = Interaction('foo789', channel, iv, INTERACTION)
    >>> interaction1 == interaction2
    False
    >>> interaction1 == interaction3
    True
    >>> interaction1 != interaction2
    True
    >>> interaction1 != interaction3
    False
    >>> mylist = [interaction1]
    >>> interaction1 in mylist
    True
    >>> interaction2 in mylist
    False
    >>> interaction3 in mylist
    True
    >>> myset = set(mylist)
    >>> interaction1 in myset
    True
    >>> interaction2 in myset
    False
    >>> interaction3 in myset
    True

    >>> interaction1 < interaction2
    True
    >>> interaction1 <= interaction3
    True
    >>> interaction2 > interaction1
    True
    >>> interaction3 >= interaction1
    True

