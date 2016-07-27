****
Form
****


Set up the environment::

    >>> from rex.core import Rex
    >>> from datetime import datetime
    >>> rex = Rex('__main__', 'rex.forms_demo')
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
    ...         'fr': u'Ma grande forme'
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
    ...                             'fr': u'Quel est votre mot préféré?'
    ...                         },
    ...                     },
    ...                 },
    ...             ],
    ...         },
    ...     ],
    ... }
    >>> form = Form('foo789', channel, iv, FORM)
    >>> form.get_display_name()
    u'Our Test Form'
    >>> unicode(form)
    u'Our Test Form'
    >>> str(form)
    'Our Test Form'
    >>> repr(form)
    "Form(u'foo789', Channel(u'chan135', u'My EDC Application', u'form'), InstrumentVersion(u'notreal456', Instrument(u'fake123', u'My Instrument Title'), 1))"

    >>> from copy import deepcopy
    >>> FORM_NOTITLE = deepcopy(FORM)
    >>> FORM_NOTITLE['defaultLocalization'] = 'fr'
    >>> form = Form('foo789', channel, iv, FORM_NOTITLE)
    >>> form.get_display_name()
    u'Ma grande forme'
    >>> del FORM_NOTITLE['title']
    >>> form = Form('foo789', channel, iv, FORM_NOTITLE)
    >>> form.get_display_name()
    u'The InstrumentVersion Title'

    >>> form.as_dict()
    {'instrument_version': {'instrument': {'status': u'active', 'code': u'fake123', 'uid': u'fake123', 'title': u'My Instrument Title'}, 'published_by': u'jay', 'version': 1, 'uid': u'notreal456', 'date_published': datetime.datetime(2014, 5, 22, 0, 0)}, 'uid': u'foo789', 'channel': {'uid': u'chan135', 'presentation_type': u'form', 'title': u'My EDC Application'}}
    >>> form.as_json()
    u'{"instrument_version": {"instrument": {"status": "active", "code": "fake123", "uid": "fake123", "title": "My Instrument Title"}, "published_by": "jay", "version": 1, "uid": "notreal456", "date_published": "2014-05-22T00:00:00"}, "uid": "foo789", "channel": {"uid": "chan135", "presentation_type": "form", "title": "My EDC Application"}}'


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
    DemoChannel(u'survey', u'RexSurvey', u'form')
    >>> form.instrument_version
    DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L)


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
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'fr': u'Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?', 'en': 'What is your favorite word?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}], 'title': {'fr': 'Ma grande forme', 'en': 'Our Test Form'}}
    >>> form.configuration = {u'instrument': {u'version': u'1.1', u'id': u'urn:test-instrument'}, u'defaultLocalization': u'en', u'pages': [{u'elements': [{u'type': u'question', u'options': {u'text': {u'fr': u'Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?', u'en': u'What is your favorite word?'}, u'fieldId': u'q_fake'}}], u'id': u'page1'}], u'title': {u'fr': u'Ma grande forme', u'en': u'A Different Title'}}

    >>> form.configuration_json
    u'{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "title": {"en": "A Different Title", "fr": "Ma grande forme"}, "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "What is your favorite word?", "fr": "Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?"}}}]}]}'
    >>> form.configuration_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ndefaultLocalization: en\ntitle: {en: A Different Title, fr: Ma grande forme}\npages:\n- id: page1\n  elements:\n  - type: question\n    options:\n      fieldId: q_fake\n      text: {en: 'What is your favorite word?', fr: 'Quel est votre mot pr\xc3\x83\xc2\xa9f\xc3\x83\xc2\xa9r\xc3\x83\xc2\xa9?'}"

    >>> form.configuration_json = u'{"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"fr": "Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?", "en": "What is your favorite word?"}, "fieldId": "q_fake"}}], "id": "page1"}], "title": {"fr": "Ma grande forme", "en": "Not an Original Title"}}'
    >>> form.configuration
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'fr': u'Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?', 'en': 'What is your favorite word?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}], 'title': {'fr': 'Ma grande forme', 'en': 'Not an Original Title'}}

    >>> form.configuration_yaml = 'instrument: {id: \'urn:test-instrument\', version: \'1.1\'}\ndefaultLocalization: en\ntitle: {en: Some New Title, fr: Ma grande forme}\npages:\n- id: page1\n  elements:\n  - type: question\n    options:\n      fieldId: q_fake\n      text: {en: \'What is your favorite word?\', fr: "Quel est votre mot pr\\xC3\\xA9\\\n          f\\xC3\\xA9r\\xC3\\xA9?"}'
    >>> form.configuration
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'fr': u'Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?', 'en': 'What is your favorite word?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}], 'title': {'fr': 'Ma grande forme', 'en': 'Some New Title'}}


There is also a set of properties for retrieving the adapted version of the
configuration. (Adapted meaning processed by the configured
PresentationAdaptor implementations)::

    >>> form.adapted_configuration
    {'instrument': {'version': '1.1', 'id': 'urn:test-instrument'}, 'defaultLocalization': 'en', 'pages': [{'elements': [{'type': 'question', 'options': {'text': {'fr': u'Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?', 'en': 'What is your favorite word?'}, 'fieldId': 'q_fake'}}], 'id': 'page1'}], 'title': {'fr': 'Ma grande forme', 'en': 'AN ADAPTED TITLE'}}

    >>> form.adapted_configuration_json
    u'{"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "title": {"en": "AN ADAPTED TITLE", "fr": "Ma grande forme"}, "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "What is your favorite word?", "fr": "Quel est votre mot pr\xc3\xa9f\xc3\xa9r\xc3\xa9?"}}}]}]}'

    >>> form.adapted_configuration_yaml
    "instrument: {id: 'urn:test-instrument', version: '1.1'}\ndefaultLocalization: en\ntitle: {en: AN ADAPTED TITLE, fr: Ma grande forme}\npages:\n- id: page1\n  elements:\n  - type: question\n    options:\n      fieldId: q_fake\n      text: {en: 'What is your favorite word?', fr: 'Quel est votre mot pr\xc3\x83\xc2\xa9f\xc3\x83\xc2\xa9r\xc3\x83\xc2\xa9?'}"


There is a static method named ``get_for_task`` which will retrieve a Form
given a Task and Channel::

    >>> channel = Channel.get_implementation().get_by_uid('entry')
    >>> task = Task.get_implementation().get_by_uid('task1')

    >>> Form.get_implementation().get_for_task('task1', 'entry')
    DemoForm(u'simple1entry', DemoChannel(u'entry', u'RexEntry', u'form'), DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L))

    >>> Form.get_implementation().get_for_task(task, 'entry')
    DemoForm(u'simple1entry', DemoChannel(u'entry', u'RexEntry', u'form'), DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L))

    >>> Form.get_implementation().get_for_task('task1', channel)
    DemoForm(u'simple1entry', DemoChannel(u'entry', u'RexEntry', u'form'), DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L))

    >>> Form.get_implementation().get_for_task(task, channel)
    DemoForm(u'simple1entry', DemoChannel(u'entry', u'RexEntry', u'form'), DemoInstrumentVersion(u'simple1', DemoInstrument(u'simple', u'Simple Instrument'), 1L))

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

