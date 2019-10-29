****
Form
****


Set up the environment::

    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> rex = Rex('__main__', 'rex.demo.forms')
    >>> rex.on()


The semi-abstract base Form class only implements a simple constructor
and string-rendering methods::

    >>> from rex.instrument.interface import Instrument, InstrumentVersion, Channel, Task
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
    >>> from rex.forms.interface import Form
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
    >>> form = Form('foo789', channel, iv, FORM)
    >>> form.get_display_name()
    'Our Test Form'
    >>> str(form)
    'Our Test Form'
    >>> str(form)
    'Our Test Form'
    >>> repr(form)
    "Form('foo789', Channel('chan135', 'My EDC Application', 'form'), InstrumentVersion('notreal456', Instrument('fake123', 'My Instrument Title'), 1))"

    >>> from copy import deepcopy
    >>> FORM_NOTITLE = deepcopy(FORM)
    >>> FORM_NOTITLE['defaultLocalization'] = 'fr'
    >>> form = Form('foo789', channel, iv, FORM_NOTITLE)
    >>> form.get_display_name()
    'Ma grande forme'
    >>> del FORM_NOTITLE['title']
    >>> form = Form('foo789', channel, iv, FORM_NOTITLE)
    >>> form.get_display_name()
    'The InstrumentVersion Title'

    >>> form.as_dict()
    {'uid': 'foo789', 'channel': {'uid': 'chan135', 'title': 'My EDC Application', 'presentation_type': 'form'}, 'instrument_version': {'uid': 'notreal456', 'instrument': {'uid': 'fake123', 'title': 'My Instrument Title', 'code': 'fake123', 'status': 'active'}, 'version': 1, 'published_by': 'jay', 'date_published': datetime.datetime(2014, 5, 22, 0, 0)}}
    >>> form.as_json()
    '{"uid": "foo789", "channel": {"uid": "chan135", "title": "My EDC Application", "presentation_type": "form"}, "instrument_version": {"uid": "notreal456", "instrument": {"uid": "fake123", "title": "My Instrument Title", "code": "fake123", "status": "active"}, "version": 1, "published_by": "jay", "date_published": "2014-05-22T00:00:00"}}'


The Channels and InstrumentVersions passed to the constructor must actually be
instances of those classes or strings containing UIDs::

    >>> form = Form('foo789', object(), iv, FORM)
    Traceback (most recent call last):
      ...
    ValueError: channel must be an instance of Channel or a UID of one
    >>> form = Form('foo789', channel, object(), FORM)
    Traceback (most recent call last):
      ...
    ValueError: instrument_version must be an instance of InstrumentVersion or a UID of one

    >>> form = Form('foo789', 'survey', 'simple1', FORM)
    >>> form.channel
    DemoChannel('survey', 'RexSurvey', 'form')
    >>> form.instrument_version
    DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1)


The configuration can be passed to the contructor as either a JSON/YAML-encoded
string or the dict equivalent::

    >>> from rex.forms.output import dump_form_json, dump_form_yaml
    >>> form = Form('foo789', channel, iv, dump_form_json(FORM))
    >>> form.validate()
    >>> form = Form('foo789', channel, iv, dump_form_yaml(FORM))
    >>> form.validate()


The configuration can be set or retrieved as either a JSON/YAML-encoded string
or a dict equivalent::

    >>> form.configuration
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'title': {'en': 'Our Test Form', 'fr': 'Ma grande forme'}, 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'What is your favorite word?', 'fr': 'Quel est votre mot préféré?'}}}]}]}
    >>> form.configuration = {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'fr': 'Quel est votre mot préféré?', 'en': 'What is your favorite word?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}], 'title': {'fr': 'Ma grande forme', 'en': 'A Different Title'}}

    >>> form.configuration_json
    '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "title": {"en": "A Different Title", "fr": "Ma grande forme"}, "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "What is your favorite word?", "fr": "Quel est votre mot préféré?"}}}]}]}'
    >>> form.configuration_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ndefaultLocalization: en\ntitle: {en: A Different Title, fr: Ma grande forme}\npages:\n- id: page1\n  elements:\n  - type: question\n    options:\n      fieldId: q_fake\n      text: {en: 'What is your favorite word?', fr: 'Quel est votre mot préféré?'}"

    >>> form.configuration_json = '{"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"fr": "Quel est votre mot préféré?", "en": "What is your favorite word?"}, "fieldId": "q_fake"}}], "id": "page1"}], "title": {"fr": "Ma grande forme", "en": "Not an Original Title"}}'
    >>> form.configuration
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'fr': 'Quel est votre mot préféré?', 'en': 'What is your favorite word?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}], 'title': {'fr': 'Ma grande forme', 'en': 'Not an Original Title'}}

    >>> form.configuration_yaml = 'instrument: {id: \'urn:test-instrument\', version: \'1.1\'}\ndefaultLocalization: en\ntitle: {en: Some New Title, fr: Ma grande forme}\npages:\n- id: page1\n  elements:\n  - type: question\n    options:\n      fieldId: q_fake\n      text: {en: \'What is your favorite word?\', fr: "Quel est votre mot pré\\\n          féré?"}'
    >>> form.configuration
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'title': {'en': 'Some New Title', 'fr': 'Ma grande forme'}, 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'What is your favorite word?', 'fr': 'Quel est votre mot préféré?'}}}]}]}


There is also a set of properties for retrieving the adapted version of the
configuration. (Adapted meaning processed by the configured
PresentationAdaptor implementations)::

    >>> form.adapted_configuration
    {'instrument': {'id': 'urn:test-instrument', 'version': '1.1'}, 'defaultLocalization': 'en', 'title': {'en': 'AN ADAPTED TITLE', 'fr': 'Ma grande forme'}, 'pages': [{'id': 'page1', 'elements': [{'type': 'question', 'options': {'fieldId': 'q_fake', 'text': {'en': 'What is your favorite word?', 'fr': 'Quel est votre mot préféré?'}}}]}]}

    >>> form.adapted_configuration_json
    '{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "title": {"en": "AN ADAPTED TITLE", "fr": "Ma grande forme"}, "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "What is your favorite word?", "fr": "Quel est votre mot préféré?"}}}]}]}'

    >>> form.adapted_configuration_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ndefaultLocalization: en\ntitle: {en: AN ADAPTED TITLE, fr: Ma grande forme}\npages:\n- id: page1\n  elements:\n  - type: question\n    options:\n      fieldId: q_fake\n      text: {en: 'What is your favorite word?', fr: 'Quel est votre mot préféré?'}"


There is a static method named ``get_for_task`` which will retrieve a Form
given a Task and Channel::

    >>> channel = Channel.get_implementation().get_by_uid('entry')
    >>> task = Task.get_implementation().get_by_uid('task1')

    >>> Form.get_implementation().get_for_task('task1', 'entry')
    DemoForm('simple1entry', DemoChannel('entry', 'RexEntry', 'form'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1))

    >>> Form.get_implementation().get_for_task(task, 'entry')
    DemoForm('simple1entry', DemoChannel('entry', 'RexEntry', 'form'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1))

    >>> Form.get_implementation().get_for_task('task1', channel)
    DemoForm('simple1entry', DemoChannel('entry', 'RexEntry', 'form'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1))

    >>> Form.get_implementation().get_for_task(task, channel)
    DemoForm('simple1entry', DemoChannel('entry', 'RexEntry', 'form'), DemoInstrumentVersion('simple1', DemoInstrument('simple', 'Simple Instrument'), 1))

    >>> Form.get_implementation().get_for_task('task5', 'entry') is None
    True

    >>> Form.get_implementation().get_for_task('doesntexist', 'entry') is None
    True

Forms can be checked for equality. Note that equality is only defined as
being the same class with the same UID::

    >>> form1 = Form('foo789', channel, iv, FORM)
    >>> form2 = Form('foo999', channel, iv, FORM)
    >>> form3 = Form('foo789', channel, iv, FORM_NOTITLE)
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



    >>> rex.off()


