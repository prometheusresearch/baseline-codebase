
from rex.instrument.interface import Assessment
from rex.db import get_db


__all__ = ('DemoAssessment',)

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
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
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
    def bulk_retrieve(cls, uids):
        db = get_db()
        with db:
            data = db.produce(
                "/assessment{uid, instrumentversion.uid :as iv, data}.filter(uid=$uids).filter(status='completed').sort(uid)",
                uids=uids,
            )
        return [
            cls.BulkAssessment(
                uid=unicode(d.uid),
                data=AnyVal().parse(d.data),
                instrument_version_uid=unicode(d.iv),
            )
            for d in data
        ]

    @classmethod
    def create(cls, subject, instrument_version, data=None, evaluation_date=None, implementation_context=None):
        return cls(
            'fake_assessment_1',
            subject,
            instrument_version,
            data,
            evaluation_date=evaluation_date,
        )

    def save(self, implementation_context=None):
        print '### SAVED ASSESSMENT ' + self.uid

