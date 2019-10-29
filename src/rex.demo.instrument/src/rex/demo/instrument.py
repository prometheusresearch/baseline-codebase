#
# Copyright (c) 2015, Prometheus Research, LLC
#


from datetime import datetime

from rex.core import IntVal, AnyVal
from rex.db import get_db

from rex.instrument.interface import *

from .modules.mymodule1 import my_calculation as my_calculation1
from .modules.mymodule2 import my_calculation as my_calculation2
from .modules.bad_not_callable_module import my_calculation as my_calculation3
from .modules.unexpected_parameters import my_calculation as my_calculation4
from .modules.complex_calculation import complex_object_calc, complex_function_calc


__all__ = (
    'DemoUser',
    'OtherDemoUser',
    'DemoSubject',
    'DemoInstrument',
    'DemoInstrumentVersion',
    'DemoAssessment',
    'DemoDraftInstrumentVersion',
    'DemoChannel',
    'DemoTask',
    'DemoEntry',
    'DemoSubjectSatusScopeAddon',
    'DemoCalculationSet',
    'DemoResultSet'
)


def safe_uid(clazz, value):
    if isinstance(value, clazz):
        return value.uid
    else:
        return value


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
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
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
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        db = get_db()
        with db:
            data = db.produce('/subject.sort(uid)')
        return [
            cls(d.uid)
            for d in data
        ]

    @classmethod
    def create(cls, mobile_tn=None, implementation_context=None):
        return cls(
            'fake_subject_1',
            mobile_tn=mobile_tn,
        )

    def save(cls, implementation_context=None):
        print('### SAVED SUBJECT ' + self.uid)


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
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
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
    def create(cls, uid, title, status=None, implementation_context=None):
        return cls(uid, uid, title, status=status)

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

    def save(self, implementation_context=None):
        print('### SAVED INSTRUMENT ' + self.uid)


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
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
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
    def get_implementation_context(cls, action):
        if action == cls.CONTEXT_ACTION_CREATE:
            return {
                'extra_param': {
                    'required': False,
                    'validator': IntVal(),
                }
            }
        return Instrument.get_implementation_context(action)

    @classmethod
    def create(cls, instrument, definition, published_by, version=None, date_published=None, implementation_context=None):
        if not version:
            latest = instrument.latest_version
            version = latest.version + 1 if latest else 1

        context = cls.validate_implementation_context(
            'create',
            implementation_context,
        )
        if context:
            print('### INSTRUMENTVERSION CREATE CONTEXT: %r' % context)

        return cls(
            'fake_instrument_version_1',
            instrument,
            definition,
            version,
            published_by,
            date_published or datetime(2014, 5, 22),
        )

    def save(self, implementation_context=None):
        print('### SAVED INSTRUMENTVERSION ' + self.uid)


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
                uid=str(d.uid),
                data=AnyVal().parse(d.data),
                instrument_version_uid=str(d.iv),
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
        print('### SAVED ASSESSMENT ' + self.uid)


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
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
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
            date_created=None,
            implementation_context=None):
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

    def save(self, implementation_context=None):
        print('### SAVED DRAFTINSTRUMENTVERSION ' + self.uid)

    def delete(self):
        print('### DELETED DRAFTINSTRUMENTVERSION ' + self.uid)

    def publish(self, user):
        return DemoInstrumentVersion(
            'fake_published_draft_instrument_1',
            self.instrument,
            self.definition,
            1,
            user.login,
            datetime(2014, 5, 22)
        )


class DemoChannel(Channel):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/channel?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(data[0].uid, data[0].title, data[0].presentation_type)

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        db = get_db()
        with db:
            params = {
                'presentation_type': search_criteria.get('presentation_type'),
            }
            data = db.produce(
                '/channel.sort(uid).guard($presentation_type, filter(presentation_type=$presentation_type))',
                **params
            )
        return [
            cls(d.uid, d.title, d.presentation_type)
            for d in data
        ]

    def get_instruments(
            self,
            offset=0,
            limit=100,
            user=None,
            **search_criteria):
        db = get_db()
        with db:
            data = db.produce(
                '/instrument{uid}.filter(exists(instrumentversion.form.channel=$channel))',
                channel=self.uid,
            )
        return [
            DemoInstrument.get_by_uid(d.uid)
            for d in data
        ]


class DemoTask(Task):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/task?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoSubject.get_by_uid(data[0].subject),
            DemoInstrument.get_by_uid(data[0].instrument),
            data[0].priority,
            assessment=DemoAssessment.get_by_uid(data[0].assessment) if data[0].assessment else None,
            status=data[0].status,
            num_required_entries=data[0].num_required_entries,
            facilitator=DemoUser.get_by_uid(data[0].facilitator) if data[0].facilitator else None,
        )

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        db = get_db()
        with db:
            params = {
                'status': search_criteria.get('status'),
                'assessment': safe_uid(DemoAssessment, search_criteria.get('assessment')),
                'subject': safe_uid(DemoSubject, search_criteria.get('subject')),
                'channel': safe_uid(DemoChannel, search_criteria.get('channel')),
            }
            data = db.produce(
                '/task.sort(uid).guard($status, filter(status=$status)).guard($assessment, filter(assessment=$assessment)).guard($subject, filter(subject=$subject)).guard($channel, filter(exists(instrument.instrumentversion.form.filter(channel=$channel))))',
                **params
            )
        return [
           cls(
                d.uid,
                DemoSubject.get_by_uid(d.subject),
                DemoInstrument.get_by_uid(d.instrument),
                d.priority,
                assessment=DemoAssessment.get_by_uid(d.assessment) if d.assessment else None,
                status=d.status,
                num_required_entries=d.num_required_entries,
                facilitator=DemoUser.get_by_uid(d.facilitator) if d.facilitator else None,
            ) 
            for d in data
        ]

    @classmethod
    def create(
            cls,
            subject,
            instrument,
            priority=None,
            status=None,
            num_required_entries=None,
            facilitator=None,
            implementation_context=None):
        return cls(
            'fake_task_1',
            subject,
            instrument,
            priority=priority,
            status=status,
            num_required_entries=num_required_entries,
            facilitator=faciliator,
        )

    def save(self, implementation_context=None):
        print('### SAVED TASK ' + self.uid)


class DemoEntry(Entry):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/entry?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoAssessment.get_by_uid(data[0].assessment),
            data[0].entry_type,
            data[0].data,
            data[0].created_by,
            data[0].date_created,
            data[0].ordinal,
            modified_by=data[0].modified_by,
            date_modified=data[0].date_modified,
            status=data[0].status,
            memo=data[0].memo,
        )

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        db = get_db()
        with db:
            params = {
                'assessment': safe_uid(DemoAssessment, search_criteria.get('assessment')),
                'type': search_criteria.get('type'),
                'status': search_criteria.get('status'),
                'ordinal': search_criteria.get('ordinal'),
            }
            data = db.produce(
                '/entry.sort(uid).guard($assessment, filter(assessment=$assessment)).guard($type, filter(entry_type=$type)).guard($status, filter(status=$status)).guard($ordinal, filter(ordinal=$ordinal))',
                **params
            )
        return [
           cls(
                d.uid,
                DemoAssessment.get_by_uid(d.assessment),
                d.entry_type,
                d.data,
                d.created_by,
                d.date_created,
                d.ordinal,
                modified_by=d.modified_by,
                date_modified=d.date_modified,
                status=d.status,
                memo=d.memo,
            ) 
            for d in data
        ]

    @classmethod
    def create(
            cls,
            assessment,
            entry_type,
            created_by,
            date_created=None,
            data=None,
            status=None,
            memo=None,
            ordinal=None,
            implementation_context=None):
        return cls(
            'fake_entry_1',
            assessment,
            entry_type,
            data or {},
            created_by,
            date_created or datetime(2014, 5, 22),
            ordinal or 1,
            status=status,
            memo=memo,
        )

    def save(self, implementation_context=None):
        print('### SAVED ENTRY ' + self.uid)


class DemoSubjectSatusScopeAddon(CalculationScopeAddon):
    name = 'subject_status'
    allowed_methods = [
        'python',
        'htsql',
    ]

    @classmethod
    def get_scope_value(cls, assessment):
        db = get_db()
        data = db.produce(
            '/assessment{status}.filter(id()=$uid)',
            uid=assessment.uid,
        )
        if not data:
            return None
        return data[0].status


class DemoCalculationSet(CalculationSet):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('''
                /instrumentversion
                    ?id()=$uid
                    {
                        id:=id(),
                        instrument_version:=id(),
                        definition:=calculation_json
                    }
                ''', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoInstrumentVersion.get_by_uid(data[0].instrument_version),
            data[0].definition
        )

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        db = get_db()
        with db:
            params = {
                'instrument_version': safe_uid(DemoInstrumentVersion, search_criteria.get('instrument_version')),
            }
            data = db.produce(
                '''/instrumentversion
                    {
                        uid:=id(),
                        instrument_version:=id(),
                        definition:=calculation_json
                    }
                    .guard($instrument_version, filter(id()=$instrument_version))
                    .filter(!is_null(calculation_json))
                ''',
                **params
            )
        return [
            cls(
                d.uid,
                DemoInstrumentVersion.get_by_uid(d.instrument_version),
                d.definition
            )
            for d in data
        ]

    @classmethod
    def get_implementation_context(cls, action):
        if action == cls.CONTEXT_ACTION_CREATE:
            return {
                'extra_param': {
                    'required': False,
                    'validator': IntVal(),
                }
            }
        return Instrument.get_implementation_context(action)

    @classmethod
    def create(cls, instrument_version, definition, implementation_context=None):
        context = cls.validate_implementation_context(
            'create',
            implementation_context,
        )
        if context:
            print('### CALCULATIONSET CREATE CONTEXT: %r' % context)

        return cls(
            'fake_calculationset_1',
            instrument_version,
            definition,
        )

    def save(self, implementation_context=None):
        print('### SAVED CALCULATIONSET ' + self.uid)


class DemoResultSet(ResultSet):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('''
                /assessment
                    ?id()=$uid
                    {
                        id:=id(),
                        assessment:=id(),
                        results:=calculation
                    }
                ''', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoAssessment.get_by_uid(data[0].assessment),
            data[0].results
        )

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        db = get_db()
        with db:
            params = {
                'assessment': search_criteria.get('assessment'),
            }
            data = db.produce(
                '''/assessment
                    {
                        uid:=id(),
                        assessment:=id(),
                        results:=calculation
                    }
                    .guard($assessment, filter(id()=$assessment))
                ''',
                **params
            )
        return [
            cls(
                d.uid,
                DemoAssessment.get_by_uid(d.assessment),
                d.results
            )
            for d in data
        ]

    @classmethod
    def create(cls, assessment, results, implementation_context=None):
        print('### CREATED RECORDSET ' + assessment.uid, results)
        return cls(
            assessment.uid,
            assessment,
            results
        )


class DemoDraftCalculationSet(DraftCalculationSet):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/draftinstrumentversion?id()=$uid&!is_null(calculation_json)', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoDraftInstrumentVersion.get_by_uid(data[0].uid),
            data[0].calculation_json,
        )

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        db = get_db()
        with db:
            params = {
                'draftinstrumentversion': safe_uid(DemoDraftInstrumentVersion, search_criteria.get('draft_instrument_version')),
            }
            data = db.produce(
                '/draftinstrumentversion.sort(uid).guard($draftinstrumentversion, filter(uid=$draftinstrumentversion)).filter(!is_null(calculation_json))',
                **params
            )
        return [
           cls(
                d.uid,
                DemoDraftInstrumentVersion.get_by_uid(d.uid),
                d.calculation_json,
            )
            for d in data
        ]

    @classmethod
    def create(cls, draft_instrument_version, definition=None, implementation_context=None):
        return cls(
            'fake_draftcalculationset_1',
            draft_instrument_version,
            definition,
        )

    def save(self, implementation_context=None):
        print('### SAVED DRAFTCALCULATIONSET ' + self.uid)

    def delete(self):
        print('### DELETED DRAFTCALCULATIONSET ' + self.uid)

