#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.instrument.interface import *


class MyUser(User):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(uid, 'fake_login')

    @classmethod
    def get_by_login(cls, login):
        return cls('fake_user_1', login)

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        return [
            cls.get_by_uid('fake_user_1', 'fake_login1'),
            cls.get_by_uid('fake_user_2', 'fake_login2'),
        ]

    def find_subjects(self, offset=0, limit=100, **search_criteria):
        return []

    def has_subject(self, subject):
        return False

    def find_instruments(self, offset=0, limit=100, **search_criteria):
        return []

    def has_instrument(self, instrument):
        return False


class MyOtherUser(MyUser):
    @classmethod
    def get_by_uid(cls, uid):
        return MyUser.get_by_uid('%s_other' % uid)


class MySubject(Subject):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(uid)

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        return [
            cls.get_by_uid('fake_subject_1'),
            cls.get_by_uid('fake_subject_2'),
        ]


class MyInstrument(Instrument):
    @classmethod
    def get_by_uid(cls, uid):
        return cls.create(uid, 'Title for %s' % uid)

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        return [
            cls.get_by_uid('fake_instrument_1'),
            cls.get_by_uid('fake_instrument_2'),
        ]

    @classmethod
    def create(cls, uid, title):
        return cls(uid, title)

    def get_version(self, version):
        return MyInstrumentVersion.create(self, {}, version)

    def get_latest_version(self):
        return self.get_version(99)

    def save(self):
        pass


class MyInstrumentVersion(InstrumentVersion):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(
            uid,
            MyInstrument.get_by_uid('fake_instrument_1iv'),
            {},
            '1',
        )

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        return [
            cls(
                'fake_instrument_version_1',
                MyInstrument('fake_instrument_1iv'),
                {},
                '1',
            ),
            cls(
                'fake_instrument_version_2',
                MyInstrument('fake_instrument_2iv'),
                {},
                '2',
            )
        ]

    @classmethod
    def create(cls, instrument, definition, version=None):
        return cls(
            'fake_instrument_version_1',
            instrument,
            definition,
            version,
        )

    def save(self):
        pass


class MyAssessment(Assessment):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(
            uid,
            MySubject.get_by_uid('fake_subject_1a'),
            MyInstrumentVersion.get_by_uid('fake_instrument_version_1a'),
            {},
        )

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        return [
            cls(
                'fake_assessment_1',
                MySubject.get_by_uid('fake_subject_1a'),
                MyInstrumentVersion.get_by_uid('fake_instrument_version_1a'),
                {},
            ),
            cls(
                'fake_assessment_2',
                MySubject.get_by_uid('fake_subject_2a'),
                MyInstrumentVersion.get_by_uid('fake_instrument_version_2a'),
                {},
            )
        ]

    @classmethod
    def create(cls, subject, instrument_version, data=None):
        return cls(
            'fake_assessment_1',
            subject,
            instrument_version,
            data,
        )

    def save(self):
        pass

