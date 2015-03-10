#
# Copyright (c) 2014, Prometheus Research, LLC
#

import json
import os.path

from datetime import datetime

from webob.exc import HTTPNotFound

from rex.core import StrVal, BoolVal
from rex.db import get_db
from rex.web import Command, Parameter, render_to_response
from rex.forms.interface import Channel, Form, Task, Entry, DraftForm, \
    TaskCompletionProcessor

from rex.instrument_demo import *


__all__ = (
    'DemoChannel',
    'OtherDemoChannel',
    'DemoForm',
    'DemoTask',
    'DemoEntry',
    'DemoDraftForm',
)


class Examples(Command):
    access = 'anybody'
    path = '/'

    def get_examples(self):
        return [
            self.read_example_metadata(example)
            for example
            in os.listdir(self.package().abspath('examples'))
        ]

    def read_example_metadata(self, name):
        path = self.package().abspath(os.path.join('examples', name, 'form.json'))
        with open(path, 'r') as f:
            title = get_form_title(json.loads(f.read()))
        return {
            "name": name,
            "title": title
        }

    def render(self, req):
        return render_to_response(
            'rex.forms_demo:/templates/examples.html', req,
            title='Rex Forms Demo', examples=self.get_examples())


class Example(Command):
    access = 'anybody'
    path = '/examples/{name}'
    parameters = [
        Parameter('name', StrVal()),
        Parameter('overview', BoolVal(), default=False),
        Parameter('read_only', BoolVal(), default=False),
    ]

    def render(self, req, name=None, overview=False, read_only=False):
        if not name:
            raise HTTPNotFound()

        path = self.package().abspath(os.path.join('examples', name))

        if not os.path.exists(path):
            raise HTTPNotFound()

        with open(os.path.join(path, 'form.json'), 'r') as f:
            form = f.read()

        with open(os.path.join(path, 'instrument.json'), 'r') as f:
            instrument = f.read()

        form_title = get_form_title(json.loads(form))

        return render_to_response(
            'rex.forms_demo:/templates/example.html', req,
            title='Rex Forms Demo: %s' % form_title,
            overview=overview, read_only=read_only,
            form=form, instrument=instrument)


def get_form_title(form):
    title = form.get('title')
    if not title:
        return
    if isinstance(title, basestring):
        return title
    return title.get('en')




def safe_uid(clazz, value):
    if isinstance(value, clazz):
        return value.uid
    else:
        return value


class DemoChannel(Channel):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/channel?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(data[0].uid, data[0].title)

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        db = get_db()
        with db:
            data = db.produce('/channel.sort(uid)')
        return [
            cls(d.uid, d.title)
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

class OtherDemoChannel(DemoChannel):
    pass


class DemoForm(Form):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/form?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoChannel.get_by_uid(data[0].channel),
            DemoInstrumentVersion.get_by_uid(data[0].instrumentversion),
            data[0].configuration,
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        db = get_db()
        with db:
            params = {
                'channel': safe_uid(DemoChannel, search_criteria.get('channel')),
                'instrument_version': safe_uid(DemoInstrumentVersion, search_criteria.get('instrument_version')),
            }
            data = db.produce(
                '/form.sort(uid).guard($instrument_version, filter(instrumentversion=$instrument_version)).guard($channel, filter(channel=$channel))',
                **params
            )
        return [
           cls(
                d.uid,
                DemoChannel.get_by_uid(d.channel),
                DemoInstrumentVersion.get_by_uid(d.instrumentversion),
                d.configuration,
            ) 
            for d in data
        ]

    @classmethod
    def create(cls, channel, instrument_version, configuration):
        return cls(
            'fake_form_1',
            channel,
            instrument_version,
            configuration,
        )

    def save(self):
        print '### SAVED FORM ' + self.uid


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
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
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
            facilitator=None):
        return cls(
            'fake_task_1',
            subject,
            instrument,
            priority=priority,
            status=status,
            num_required_entries=num_required_entries,
            facilitator=faciliator,
        )

    @Task.can_enter_data.getter
    def can_enter_data(self):
        if not self.is_done:
            entries = self.get_entries(type=Entry.TYPE_PRELIMINARY)
            if self.num_required_entries > len(entries):
                return True
        return False

    @Task.can_reconcile.getter
    def can_reconcile(self):
        if not self.is_done:
            entries = self.get_entries(type=Entry.TYPE_PRELIMINARY)
            completed = len([
                entry
                for entry in entries
                if entry.is_done
            ])
            if completed > 0:
                if completed == len(entries):
                    if len(entries) >= self.num_required_entries:
                        return True
        return False

    def get_form(self, channel):
        if self.instrument_version:
            forms = DemoForm.find(
                channel=channel.uid,
                instrument_version=self.instrument_version.uid,
                limit=1,
            )
            if forms:
                return forms[0]
        return None

    def get_entries(self, **search_criteria):
        if self.assessment:
            search_criteria['assessment'] = self.assessment.uid
            return DemoEntry.find(**search_criteria)
        return []

    def start_entry(self, user, entry_type=None, override_workflow=False, ordinal=None):
        entry_type = entry_type or Entry.TYPE_PRELIMINARY
        if entry_type == Entry.TYPE_PRELIMINARY \
                and not self.can_enter_data \
                and not override_workflow:
            raise errors.FormError(
                'This Task does not allow an additional Preliminary Entry.'
            )

        entry = DemoEntry.create(
            self.assessment,
            entry_type,
            user.login,
            ordinal=ordinal,
        )

        return entry

    def complete_entry(self, entry, user):
        entry.complete(user)
        entry.save()

    def reconcile(
            self,
            user,
            reconciled_discrepancies=None,
            override_workflow=False):
        if not self.can_reconcile and not override_workflow:
            raise errors.FormError(
                'This Task cannot be reconciled in its current state.',
            )

        reconciled_data = self.solve_discrepancies(reconciled_discrepancies)

        entry = self.start_entry(user, Entry.TYPE_RECONCILED)
        entry.data = reconciled_data
        entry.complete(user)
        entry.save()

        self.assessment.data = reconciled_data
        self.assessment.complete(user)
        self.assessment.save()

        self.status = Task.STATUS_COMPLETE
        self.save()

        TaskCompletionProcessor.execute_processors(self, user)

    def save(self):
        print '### SAVED TASK ' + self.uid


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
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
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
            ordinal=None):
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

    def save(self):
        print '### SAVED ENTRY ' + self.uid


class DemoDraftForm(DraftForm):
    @classmethod
    def get_by_uid(cls, uid, user=None):
        db = get_db()
        with db:
            data = db.produce('/draftform?id()=$uid', uid=uid)
        if not data:
            return None
        return cls(
            data[0].uid,
            DemoChannel.get_by_uid(data[0].channel),
            DemoDraftInstrumentVersion.get_by_uid(data[0].draftinstrumentversion),
            data[0].configuration,
        )

    @classmethod
    def find(cls, offset=0, limit=100, user=None, **search_criteria):
        db = get_db()
        with db:
            params = {
                'draftinstrumentversion': safe_uid(DemoDraftInstrumentVersion, search_criteria.get('draft_instrument_version')),
            }
            data = db.produce(
                '/draftform.sort(uid).guard($draftinstrumentversion, filter(draftinstrumentversion=$draftinstrumentversion))',
                **params
            )
        return [
           cls(
                d.uid,
                DemoChannel.get_by_uid(d.channel),
                DemoDraftInstrumentVersion.get_by_uid(d.draftinstrumentversion),
                d.configuration,
            ) 
            for d in data
        ]

    @classmethod
    def create(cls, channel, draft_instrument_version, configuration=None):
        return cls(
            'fake_draftform_1',
            channel,
            draft_instrument_version,
            configuration,
        )

    def save(self):
        print '### SAVED DRAFTFORM ' + self.uid

    def delete(self):
        print '### DELETED DRAFTFORM ' + self.uid

