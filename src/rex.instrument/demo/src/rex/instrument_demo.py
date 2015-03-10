#
# Copyright (c) 2015, Prometheus Research, LLC
#


from datetime import datetime

from rex.db import get_db

from rex.instrument.interface import *


__all__ = (
    'DemoUser',
    'OtherDemoUser',
    'DemoSubject',
    'DemoInstrument',
    'DemoInstrumentVersion',
    'DemoAssessment',
    'DemoDraftInstrumentVersion',
)


class DemoUser(User):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/user?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(data[0].remote_user, data[0].remote_user)

    @classmethod
    def get_by_login(cls, login, user=None):
        db = get_db()
        with db:
            data = db.produce('/user?remote_user=$login', login=login)
        if not data:
            return None
        return cls(data[0].remote_user, data[0].remote_user)

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        db = get_db()
        with db:
            data = db.produce('/user.sort(remote_user)')
        return [
            cls(d.remote_user, d.remote_user)
            for d in data
        ]


class OtherDemoUser(DemoUser):
    pass


class DemoSubject(Subject):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/subject?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(data[0].uid)

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        db = get_db()
        with db:
            data = db.produce('/subject.sort(uid)')
        return [
            cls(d.uid)
            for d in data
        ]


class DemoInstrument(Instrument):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/instrument?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            data[0].code,
            data[0].title,
            status=data[0].status,
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        db = get_db()
        with db:
            data = db.produce('/instrument.sort(uid)')
        return [
           cls(
                d.uid,
                d.code,
                d.title,
                status=d.status,
            ) 
            for d in data
        ]

    @classmethod
    def create(cls, uid, title, status=None):
        return cls(uid, uid, title, status=status)

    def get_version(self, version):
        ivs = DemoInstrumentVersion.find(
            instrument=self.uid,
            version=version,
        )
        if ivs:
            return ivs[0]
        return None

    @property
    def latest_version(self):
        db = get_db()
        with db:
            data = db.produce(
                '/max(instrumentversion{version}?instrument=$instrument)',
                instrument=self.uid,
            )
        if data:
            return self.get_version(data[0])
        return None

    def save(self):
        print '### SAVED INSTRUMENT ' + self.uid


class DemoInstrumentVersion(InstrumentVersion):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/instrumentversion?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoInstrument.get_by_uid(data[0].instrument),
            data[0].definition,
            data[0].version,
            data[0].published_by,
            data[0].date_published,
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        db = get_db()
        with db:
            params = {
                'instrument': search_criteria.get('instrument'),
                'version': search_criteria.get('version'),
            }
            data = db.produce(
                '/instrumentversion.guard($instrument, filter(instrument=$instrument)).guard($version, filter(version=$version)).sort(uid)',
                **params
            )
        return [
            cls(
                d.uid,
                DemoInstrument.get_by_uid(d.instrument),
                d.definition,
                d.version,
                d.published_by,
                d.date_published,
            )
            for d in data
        ]

    @classmethod
    def create(cls, instrument, definition, published_by, version=None, date_published=None):
        if not version:
            latest = instrument.latest_version
            version = latest.version + 1 if latest else 1
        return cls(
            'fake_instrument_version_1',
            instrument,
            definition,
            version,
            published_by,
            date_published or datetime(2014, 5, 22),
        )

    def save(self):
        print '### SAVED INSTRUMENTVERSION ' + self.uid


class DemoAssessment(Assessment):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/assessment?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoSubject.get_by_uid(data[0].subject),
            DemoInstrumentVersion.get_by_uid(data[0].instrumentversion),
            data[0].data,
            evaluation_date=data[0].evaluation_date,
            status=data[0].status,
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        db = get_db()
        with db:
            data = db.produce('/assessment.sort(uid)')
        return [
            cls(
                d.uid,
                DemoSubject.get_by_uid(d.subject),
                DemoInstrumentVersion.get_by_uid(d.instrumentversion),
                d.data,
                evaluation_date=d.evaluation_date,
                status=d.status,
            )
            for d in data
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
        print '### SAVED ASSESSMENT ' + self.uid


class DemoDraftInstrumentVersion(DraftInstrumentVersion):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/draftinstrumentversion?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoInstrument.get_by_uid(data[0].instrument),
            data[0].created_by,
            data[0].date_created,
            definition=data[0].definition,
            parent_instrument_version=DemoInstrumentVersion.get_by_uid(data[0].parent_instrumentversion) if data[0].parent_instrumentversion else None,
            modified_by=data[0].modified_by,
            date_modified=data[0].date_modified,
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        db = get_db()
        with db:
            data = db.produce('/draftinstrumentversion.sort(uid)')
        return [
            cls(
                d.uid,
                DemoInstrument.get_by_uid(d.instrument),
                d.created_by,
                d.date_created,
                definition=d.definition,
                parent_instrument_version=DemoInstrumentVersion.get_by_uid(d.parent_instrumentversion) if d.parent_instrumentversion else None,
                modified_by=d.modified_by,
                date_modified=d.date_modified,
            )
            for d in data
        ]

    @classmethod
    def create(
            cls,
            instrument,
            created_by,
            definition=None,
            parent_instrument_version=None,
            date_created=None):
        return cls(
            'draftiv1',
            instrument,
            created_by,
            date_created or datetime(2014, 5, 22),
            definition=definition,
            parent_instrument_version=parent_instrument_version,
        )

    def modify(self, user):
        self.modified_by = user.login
        self.date_modified = datetime(2014, 5, 22, 12, 34, 56)

    def save(self):
        print '### SAVED DRAFTINSTRUMENTVERSION ' + self.uid

    def delete(self):
        print '### DELETED DRAFTINSTRUMENTVERSION ' + self.uid

    def publish(self, user):
        return DemoInstrumentVersion(
            'fake_published_draft_instrument_1',
            self.instrument,
            self.definition,
            1,
            user.login,
            datetime(2014, 5, 22)
        )

