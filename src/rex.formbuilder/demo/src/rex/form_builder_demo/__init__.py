#
# Copyright (c) 2014, Prometheus Research, LLC
#


from datetime import datetime

from rex.instrument import interface as instrument_interface
from rex.forms import interface as forms_interface
from rex.web import Authorize

class User(instrument_interface.User):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        if uid == 'doesntexist':
            return None
        return cls(uid, 'login_%s' % uid)

    @classmethod
    def get_by_login(cls, login, user=None):
        if login == 'doesntexist':
            return None
        return cls('uid_%s' % login, login)

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        return [
            cls.get_by_uid('fake_user_1'),
            cls.get_by_uid('fake_user_2'),
        ][offset:(offset+limit)]


class Subject(instrument_interface.Subject):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        if uid == 'doesntexist':
            return None
        return cls(uid)

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        return [
            cls.get_by_uid('fake_subject_1'),
            cls.get_by_uid('fake_subject_2'),
        ][offset:(offset+limit)]


class Instrument(instrument_interface.Instrument):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        if uid == 'doesntexist':
            return None
        return cls(uid, uid, 'Title for %s' % uid)

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        return [
            cls.get_by_uid('fake_instrument_1'),
            cls.get_by_uid('fake_instrument_2'),
        ][offset:(offset+limit)]

    @classmethod
    def create(cls, uid, title, status):
        print '### CREATED INSTRUMENT'
        return cls(uid, uid, title, status)

    def get_version(self, version):
        return InstrumentVersion.get_by_uid('fake_instrument_version_99')

    @property
    def latest_version(self):
        return self.get_version(99)

    def save(self):
        print '### SAVED INSTRUMENT %s' % self.uid


class InstrumentVersion(instrument_interface.InstrumentVersion):
    DEFINITION = {
        'id': 'urn:some-instrument',
        'version': '1.0',
        'title': 'Some Fake Instrument',
        'record': [
            {
                'id': 'foo',
                'type': 'text'
            }
        ]
    }

    @classmethod
    def get_by_uid(cls, uid, user=None):
        if uid == 'doesntexist':
            return None
        return cls(
            uid,
            Instrument.get_by_uid('fake_instrument_1iv'),
            cls.DEFINITION,
            1,
            'someone',
            datetime(2014, 5, 22),
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        return [
            cls(
                'fake_instrument_version_1',
                Instrument.get_by_uid('fake_instrument_1iv'),
                cls.DEFINITION,
                1,
                'some_person',
                datetime(2014, 5, 22),
            ),
            cls(
                'fake_instrument_version_2',
                Instrument.get_by_uid('fake_instrument_2iv'),
                cls.DEFINITION,
                '2',
                'some_person',
                datetime(2014, 5, 22),
            )
        ][offset:(offset+limit)]

    @classmethod
    def create(cls, instrument, definition, published_by, version=None, date_published=None):
        print '### CREATED INSTRUMENTVERSION'
        return cls(
            'new_instrument_version_1',
            instrument,
            definition or cls.DEFINITION,
            version or 1,
            published_by,
            date_published or datetime(2014, 5, 22),
        )

    def save(self):
        print '### SAVED INSTRUMENTVERSION %s' % self.uid


class Assessment(instrument_interface.Assessment):
    DATA = {
        'instrument': {
            'id': 'urn:some-instrument',
            'version': '1.0',
        },
        'values': {
            'foo': {
                'value': 'bar',
            },
        },
    }

    @classmethod
    def get_by_uid(cls, uid, user=None):
        if uid == 'doesntexist':
            return None
        return cls(
            uid,
            Subject.get_by_uid('fake_subject_1a'),
            InstrumentVersion.get_by_uid('fake_instrument_version_1a'),
            cls.DATA,
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        return [
            cls(
                'fake_assessment_1',
                Subject.get_by_uid('fake_subject_1a'),
                InstrumentVersion.get_by_uid('fake_instrument_version_1a'),
                cls.DATA,
            ),
            cls(
                'fake_assessment_2',
                Subject.get_by_uid('fake_subject_2a'),
                InstrumentVersion.get_by_uid('fake_instrument_version_2a'),
                cls.DATA,
            )
        ][offset:(offset+limit)]

    @classmethod
    def create(cls, subject, instrument_version, data=None):
        print '### CREATED ASSESSMENT'
        return cls(
            'new_assessment_1',
            subject,
            instrument_version,
            data or cls.DATA,
        )

    def complete(self, user):
        print '### COMPLETED ASSESSMENT %s (%r)' % (
            self.uid,
            user,
        )
        return super(Assessment, self).complete(user)

    def save(self):
        print '### SAVED ASSESSMENT %s' % self.uid


class DraftInstrumentVersion(instrument_interface.DraftInstrumentVersion):
    DEFINITION = {
        'id': 'urn:some-instrument',
        'version': '1.0',
        'title': 'Some Fake Instrument',
        'record': [
            {
                'id': 'foo',
                'type': 'text'
            }
        ]
    }

    @classmethod
    def get_by_uid(cls, uid, user=None):
        if uid == 'doesntexist':
            return None
        return cls(
            uid,
            Instrument.get_by_uid('fake_instrument_1iv'),
            'some_person',
            datetime(2014, 5, 22),
            definition=cls.DEFINITION,
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        return [
            cls(
                'fake_draft_instrument_version_1',
                Instrument.get_by_uid('fake_instrument_1div'),
                'some_person',
                datetime(2014, 05, 22),
                definition=cls.DEFINITION,
            ),
            cls(
                'fake_draft_instrument_version_2',
                Instrument.get_by_uid('fake_instrument_2div'),
                'some_person',
                datetime(2014, 05, 22),
                definition=cls.DEFINITION,
            )
        ][offset:(offset+limit)]

    @classmethod
    def create(
            cls,
            instrument,
            created_by,
            definition=None,
            parent_instrument_version=None,
            date_created=None):
        print '### CREATED DRAFTINSTRUMENTVERSION'
        return cls(
            'new_draft_instrument_version_1',
            instrument,
            created_by,
            date_created or datetime(2014, 5, 22),
            parent_instrument_version=parent_instrument_version,
            definition=definition or cls.DEFINITION,
        )

    def save(self):
        print '### SAVED DRAFTINSTRUMENTVERSION %s' % self.uid

    def delete(self):
        print '### DELETED DRAFTINSTRUMENTVERSION %s' % self.uid


class Channel(forms_interface.Channel):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        if uid == 'doesntexist':
            return None
        return cls(uid, 'Title for %s' % uid)

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        return [
            cls.get_by_uid('fake_channel_1'),
            cls.get_by_uid('fake_channel_2'),
        ][offset:(offset+limit)]


class Form(forms_interface.Form):
    CONFIGURATION = {
        'instrument': {
            'id': 'urn:some-instrument',
            'version': '1.0',
        },
        'defaultLocalization': 'en',
        'pages': [
            {
                'id': 'page1',
                'elements': [
                    {
                        'type': 'question',
                        'options': {
                            'fieldId': 'foo',
                            'text': {
                                'en': 'What is your favorite foo?',
                            },
                        },
                    },
                ],
            },
        ],
    } 

    @classmethod
    def get_by_uid(cls, uid, user=None):
        if uid == 'doesntexist':
            return None
        return cls(
            uid,
            Channel.get_by_uid('fake_channel_1'),
            InstrumentVersion.get_by_uid('fake_instrument_version_1'),
            Form.CONFIGURATION
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        return [
            cls.get_by_uid('fake_form_1'),
            cls.get_by_uid('fake_form_2'),
        ][offset:(offset+limit)]

    @classmethod
    def create(cls, channel, instrument_version, configuration):
        print '### CREATED FORM'
        return cls(
            'new_form_1',
            channel,
            instrument_version,
            configuration,
        )

    def save(self):
        print '### SAVED FORM %s' % self.uid


class DraftForm(forms_interface.DraftForm):
    CONFIGURATION = {
        'instrument': {
            'id': 'urn:some-instrument',
            'version': '1.0',
        },
        'defaultLocalization': 'en',
        'pages': [
            {
                'id': 'page1',
                'elements': [
                    {
                        'type': 'question',
                        'options': {
                            'fieldId': 'foo',
                            'text': {
                                'en': 'What is your favorite foo?',
                            },
                        },
                    },
                ],
            },
        ],
    } 

    @classmethod
    def get_by_uid(cls, uid, user=None):
        if uid == 'doesntexist':
            return None
        return cls(
            uid,
            Channel.get_by_uid('fake_channel_1'),
            DraftInstrumentVersion.get_by_uid('fake_draft_instrument_version_1'),
            DraftForm.CONFIGURATION
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        return [
            cls.get_by_uid('fake_draft_form_1'),
            cls.get_by_uid('fake_draft_form_2'),
        ][offset:(offset+limit)]

    @classmethod
    def create(cls, channel, draft_instrument_version, configuration):
        print '### CREATED DRAFTFORM'
        return cls(
            'new_draft_form_1',
            channel,
            draft_instrument_version,
            configuration,
        )

    def save(self):
        print '### SAVED DRAFTFORM %s' % self.uid

    def delete(self):
        print '### DELETED DRAFTFORM %s' % self.uid

