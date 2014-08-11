#
# Copyright (c) 2014, Prometheus Research, LLC
#

import json
import os.path

from datetime import datetime

from webob.exc import HTTPNotFound

from rex.core import Initialize, StrVal, BoolVal
from rex.web import Command, Parameter, render_to_response
from rex.forms.interface import Channel, Form, Task, Entry, DraftForm
from rex.instrument.interface import Subject, Instrument, InstrumentVersion, \
    Assessment, DraftInstrumentVersion


class InitializeRexFormsDemo(Initialize):
    pass


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



class MyChannel(Channel):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(uid, 'Title for %s' % uid)


class MyOtherChannel(MyChannel):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(uid, 'Title for %s_other' % uid)


class MyInstrument(Instrument):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(uid, uid, 'Title for %s' % uid)


class MyInstrumentVersion(InstrumentVersion):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(
            uid,
            MyInstrument.get_by_uid('fake_instrument_1iv'),
            {},
            1,
            'someone',
            datetime(2014, 5, 22),
        )


class MyForm(Form):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(
            uid,
            MyChannel.get_by_uid('channel1'),
            MyInstrumentVersion.get_by_uid('instrumentversion1'),
            {}
        )


class MySubject(Subject):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(uid)


class MyTask(Task):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(
            uid,
            MySubject.get_by_uid('subject1'),
            MyInstrument.get_by_uid('instrument1'),
            1
        )


class MyAssessment(Assessment):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(
            uid,
            MySubject.get_by_uid('fake_subject_1a'),
            MyInstrumentVersion.get_by_uid('fake_instrument_version_1a'),
            {},
        )


class MyEntry(Entry):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(
            uid,
            MyAssessment.get_by_uid('assessment1'),
            'preliminary',
            {},
            'someone',
            datetime(2014, 5, 22)
        )


class MyDraftInstrumentVersion(DraftInstrumentVersion):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(
            uid,
            MyInstrument.get_by_uid('fake_instrument_1iv'),
            'some_person',
            datetime(2014, 5, 22),
        )


class MyDraftForm(DraftForm):
    @classmethod
    def get_by_uid(cls, uid):
        return cls(
            uid,
            MyChannel.get_by_uid('channel1'),
            MyDraftInstrumentVersion.get_by_uid('draftinstrumentversion1'),
            {}
        )

