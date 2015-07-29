#
# Copyright (c) 2014, Prometheus Research, LLC
#

import yaml
import json
import sys
import os.path

from datetime import datetime
from imp import load_source

from webob.exc import HTTPNotFound

from rex.core import StrVal, BoolVal, OMapVal
from rex.db import get_db
from rex.web import Command, Parameter, render_to_response
from rex.forms.interface import *

from rex.instrument.util import get_implementation
from rex.instrument.interface.calculationmethod import PythonCalculationMethod
from rex.instrument_demo import *


__all__ = (
    'DemoForm',
    'OtherDemoForm',
    'DemoDraftForm',
)

class BaseCommand(Command):

    def get_data(self, dirname, filename):
        data = None
        path = self.package().abspath(os.path.join('examples', dirname))
        json_file = os.path.join(path, filename + '.json')
        if os.path.exists(json_file):
            with open(json_file) as f:
                data = json.loads(f.read())
        if data is None:
            yaml_file = os.path.join(path, filename + '.yaml')
            if os.path.exists(yaml_file):
                with open(yaml_file) as f:
                    data = yaml.load(f.read())
        return data

    def get_form_json(self, name):
        data = self.get_data(name, 'form')
        return None if data is None else json.dumps(data)

    def get_instrument_json(self, name):
        data = self.get_data(name, 'instrument')
        return None if data is None else json.dumps(data)

    def get_form_title(self, name):
        form = self.get_data(name, 'form')
        title = form.get('title')
        if not title:
            return
        if isinstance(title, basestring):
            return title
        return title.get('en')

    def calculate_assessment(self, name, assessment_definition):
        calculationset_definition = self.get_data(name, 'calculationset')
        if not calculationset_definition:
            return assessment_definition
        path = self.package().abspath(os.path.join('examples', name))
        python_file = os.path.join(path, 'calculationset.py')
        if os.path.exists(python_file):
            module = load_source(name, python_file)
            globals()[name] = module
        instrument_impl = get_implementation('instrument')
        instrument = instrument_impl.create(uid=name, title=name.title())

        instrument_definition = self.get_data(name, 'instrument')
        instrumentversion_impl = get_implementation('instrumentversion')
        instrumentversion = instrumentversion_impl.create(
                                            instrument=instrument,
                                            definition=instrument_definition,
                                            published_by='demo'
                            )
        calculationset_impl = get_implementation('calculationset')
        calculationset = calculationset_impl.create(
                                    instrument_version=instrumentversion,
                                    definition=calculationset_definition
                         )
        subject_impl = get_implementation('subject')
        subject = subject_impl.create()
        assessment_impl = get_implementation('assessment')
        assessment = assessment_impl.create(subject, instrumentversion,
                                            data=assessment_definition)
        assessment.status = 'completed'
        result = calculationset.execute(assessment)
        assessment.set_meta('calculations', result)
        return assessment.data


class Examples(BaseCommand):
    access = 'anybody'
    path = '/'

    def get_examples(self):
        path = self.package().abspath('examples')
        has_file = lambda dir, file: \
                os.path.isfile(os.path.join(path, dir, '%s.json' % file)) \
                or os.path.isfile(os.path.join(path, dir, '%s.yaml' % file))
        has_instrument = lambda name: has_file(name, 'instrument')
        has_form = lambda name: has_file(name, 'form')
        return [
            {'title': self.get_form_title(example), 'name': example}
            for example in os.listdir(path)
            if has_instrument(example) and has_form(example)
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


class Example(BaseCommand):
    access = 'anybody'
    path = '/examples/{name}'
    parameters = [
        Parameter('name', StrVal()),
        Parameter('overview', BoolVal(), default=False),
        Parameter('read_only', BoolVal(), default=False),
        Parameter('assessment', OMapVal(), default=None)
    ]

    def render(self, req, name=None, overview=False,
                        read_only=False, assessment=None
        ):
        if not name:
            raise HTTPNotFound()
        instrument = self.get_instrument_json(name)
        if instrument is None:
            raise HTTPNotFound("Instrument file not found")
        form = self.get_form_json(name)
        if form is None:
            raise HTTPNotFound("Form file not found")
        form_title = self.get_form_title(name)
        if assessment:
            assessment = self.calculate_assessment(name, assessment)
            print assessment
        return render_to_response(
            'rex.forms_demo:/templates/example.html', req,
            title='Rex Forms Demo: %s' % form_title,
            name=name,
            overview=overview,
            read_only=read_only,
            form=form,
            instrument=instrument,
            assessment=assessment)


def safe_uid(clazz, value):
    if isinstance(value, clazz):
        return value.uid
    else:
        return value


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
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
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
    def create(cls, channel, instrument_version, configuration, implementation_context=None):
        return cls(
            'fake_form_1',
            channel,
            instrument_version,
            configuration,
        )

    def save(self, implementation_context=None):
        print '### SAVED FORM ' + self.uid


class OtherDemoForm(DemoForm):
    pass


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
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
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
    def create(cls, channel, draft_instrument_version, configuration=None, implementation_context=None):
        return cls(
            'fake_draftform_1',
            channel,
            draft_instrument_version,
            configuration,
        )

    def save(self, implementation_context=None):
        print '### SAVED DRAFTFORM ' + self.uid

    def delete(self):
        print '### DELETED DRAFTFORM ' + self.uid


