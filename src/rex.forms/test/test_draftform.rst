*********
DraftForm
*********


Set up the environment::

    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> rex = Rex('__main__', 'rex.forms_demo')
    >>> rex.on()


The semi-abstract base DraftForm class only implements a simple constructor
and string-rendering methods::

    >>> from rex.instrument.interface import Instrument, DraftInstrumentVersion, Channel
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
    >>> div = DraftInstrumentVersion('notreal456', instrument, 'jay', datetime(2014, 5, 22), definition=INSTRUMENT)
    >>> from rex.forms.interface import DraftForm
    >>> channel = Channel('chan135', 'My EDC Application', Channel.PRESENTATION_TYPE_FORM)
    >>> FORM = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1',
    ...     },
    ...     'defaultLocalization': 'en',
    ...     'title': {
    ...         'en': 'Our Test Form',
    ...         'fr': 'Ma grande forme'
    ...     },
    ...     'pages': [
    ...         {
    ...             'id': 'page1',
    ...             'elements': [
    ...                 {
    ...                     'type': 'question',
    ...                     'options': {
    ...                         'fieldId': 'q_fake',
    ...                         'text': {
    ...                             'en': 'What is your favorite word?',
    ...                             'fr': 'Quel est votre mot préféré?'
    ...                         },
    ...                     },
    ...                 },
    ...             ],
    ...         },
    ...     ],
    ... }
    >>> df = DraftForm('foo789', channel, div, FORM)
    >>> df.get_display_name()
    'Our Test Form'
    >>> str(df)
    'Our Test Form'
    >>> str(df)
    'Our Test Form'
    >>> repr(df)
    "DraftForm('foo789', Channel('chan135', 'My EDC Application', 'form'), DraftInstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title')))"

    >>> from copy import deepcopy
    >>> FORM_NOTITLE = deepcopy(FORM)
    >>> FORM_NOTITLE['defaultLocalization'] = 'fr'
    >>> df = DraftForm('foo789', channel, div, FORM_NOTITLE)
    >>> df.get_display_name()
    'Ma grande forme'
    >>> del FORM_NOTITLE['title']
    >>> df = DraftForm('foo789', channel, div, FORM_NOTITLE)
    >>> df.get_display_name()
    'The InstrumentVersion Title'

    >>> df.as_dict()
    {'uid': 'foo789', 'draft_instrument_version': {'uid': 'notreal456', 'instrument': {'uid': 'fake123', 'title': 'My Instrument Title', 'code': 'fake123', 'status': 'active'}, 'parent_instrument_version': None, 'created_by': 'jay', 'date_created': datetime.datetime(2014, 5, 22, 0, 0), 'modified_by': 'jay', 'date_modified': datetime.datetime(2014, 5, 22, 0, 0)}, 'channel': {'uid': 'chan135', 'title': 'My EDC Application', 'presentation_type': 'form'}}
    >>> df.as_json()
    '{"uid": "foo789", "draft_instrument_version": {"uid": "notreal456", "instrument": {"uid": "fake123", "title": "My Instrument Title", "code": "fake123", "status": "active"}, "parent_instrument_version": null, "created_by": "jay", "date_created": "2014-05-22T00:00:00", "modified_by": "jay", "date_modified": "2014-05-22T00:00:00"}, "channel": {"uid": "chan135", "title": "My EDC Application", "presentation_type": "form"}}'


The Channels and DraftInstrumentVersions passed to the constructor must
actually be instances of those classes or strings containing UIDs::

    >>> df = DraftForm('foo789', object(), div, FORM)
    Traceback (most recent call last):
      ...
    ValueError: channel must be an instance of Channel or a UID of one
    >>> df = DraftForm('foo789', channel, object(), FORM)
    Traceback (most recent call last):
      ...
    ValueError: draft_instrument_version must be an instance of DraftInstrumentVersion or a UID of one

    >>> df = DraftForm('foo789', 'survey', 'draftiv1', FORM)
    >>> df.channel
    DemoChannel('survey', 'RexSurvey', 'form')
    >>> df.draft_instrument_version
    DemoDraftInstrumentVersion('draftiv1', DemoInstrument('simple', 'Simple Instrument'))

    >>> iv = df.draft_instrument_version.instrument.latest_version
    >>> iv.definition['version'] = '1.3'
    >>> df.configuration['instrument']
    {'id': 'urn:test-instrument', 'version': '1.1'}
    >>> form = df.publish(iv)
    >>> form
    DemoForm('fake_form_1', DemoChannel('survey', 'RexSurvey', 'form'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1))
    >>> form.configuration['instrument']
    {'id': 'urn:test-instrument', 'version': '1.3'}


The configuration can be passed to the contructor as either a JSON/YAML-encoded
string or the dict equivalent::

    >>> from rex.forms.output import dump_form_json, dump_form_yaml
    >>> df = DraftForm('foo789', channel, div, dump_form_json(FORM))
    >>> df.validate()
    >>> df = DraftForm('foo789', channel, div, dump_form_yaml(FORM))
    >>> df.validate()


The configuration can be set or retrieved as either a JSON/YAML-encoded string
or a dict equivalent::

    >>> df.configuration
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'title': {'en': 'Our Test Form', 'fr': 'Ma grande forme'}, 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'What is your favorite word?', 'fr': 'Quel est votre mot préféré?'}}}]}]}
    >>> df.configuration = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'fr': 'Quel est votre mot préféré?', 'en': 'What is your favorite word?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}], 'title': {'fr': 'Ma grande forme', 'en': 'A Different Title'}}

    >>> df.configuration_json
    '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "title": {"en": "A Different Title", "fr": "Ma grande forme"}, "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "What is your favorite word?", "fr": "Quel est votre mot préféré?"}}}]}]}'
    >>> df.configuration_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ndefaultLocalization: en\ntitle: {en: A Different Title, fr: Ma grande forme}\npages:\n- id: page1\n  elements:\n  - type: question\n    options:\n      fieldId: q_fake\n      text: {en: 'What is your favorite word?', fr: 'Quel est votre mot préféré?'}"

    >>> df.configuration_json = '{"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"fr": "Quel est votre mot préféré?", "en": "What is your favorite word?"}, "fieldId": "q_fake"}}], "id": "page1"}], "title": {"fr": "Ma grande forme", "en": "Not an Original Title"}}'
    >>> df.configuration
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'fr': 'Quel est votre mot préféré?', 'en': 'What is your favorite word?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}], 'title': {'fr': 'Ma grande forme', 'en': 'Not an Original Title'}}

    >>> df.configuration_yaml = 'instrument: {id: \'urn:test-instrument\', version: \'1.1\'}\ndefaultLocalization: en\ntitle: {en: Changed Again, fr: Ma grande forme}\npages:\n- id: page1\n  elements:\n  - type: question\n    options:\n      fieldId: q_fake\n      text: {en: \'What is your favorite word?\', fr: "Quel est votre mot pré\\\n          féré?"}'
    >>> df.configuration
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'title': {'en': 'Changed Again', 'fr': 'Ma grande forme'}, 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'What is your favorite word?', 'fr': 'Quel est votre mot préféré?'}}}]}]}

    >>> df.configuration = None
    >>> df.configuration is None
    True
    >>> df.configuration_json is None
    True
    >>> df.configuration_yaml is None
    True


There is also a set of properties for retrieving the adapted version of the
configuration. (Adapted meaning processed by the configured
PresentationAdaptor implementations)::

    >>> df.configuration = FORM
    >>> df.adapted_configuration
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'title': {'en': 'AN ADAPTED TITLE', 'fr': 'Ma grande forme'}, 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'What is your favorite word?', 'fr': 'Quel est votre mot préféré?'}}}]}]}

    >>> df.adapted_configuration_json
    '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "title": {"en": "AN ADAPTED TITLE", "fr": "Ma grande forme"}, "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "What is your favorite word?", "fr": "Quel est votre mot préféré?"}}}]}]}'

    >>> df.adapted_configuration_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ndefaultLocalization: en\ntitle: {en: AN ADAPTED TITLE, fr: Ma grande forme}\npages:\n- id: page1\n  elements:\n  - type: question\n    options:\n      fieldId: q_fake\n      text: {en: 'What is your favorite word?', fr: 'Quel est votre mot préféré?'}"


DraftForms can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> form1 = DraftForm('foo789', channel, div, FORM)
    >>> form2 = DraftForm('foo999', channel, div, FORM)
    >>> form3 = DraftForm('foo789', channel, div, FORM_NOTITLE)
    >>> form1 == form2
    False
    >>> form1 == form3
    True
    >>> form1 != form2
    True
    >>> form1 != form3
    False
    >>> mylist = [form1]
    >>> form1 in mylist
    True
    >>> form2 in mylist
    False
    >>> form3 in mylist
    True
    >>> myset = set(mylist)
    >>> form1 in myset
    True
    >>> form2 in myset
    False
    >>> form3 in myset
    True

    >>> form1 < form2
    True
    >>> form1 <= form3
    True
    >>> form2 > form1
    True
    >>> form3 >= form1
    True


