#
# Copyright (c) 2014, Prometheus Research, LLC
#

import os, os.path
import json
from webob.exc import HTTPNotFound
from rex.core import Initialize, StrVal, BoolVal
from rex.web import Command, Parameter, render_to_response
from rex.forms.interface import Channel, Form, Task, Entry, DraftForm


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
    pass


class MyOtherChannel(MyChannel):
    pass


class MyForm(Form):
    pass


class MyTask(Task):
    pass


class MyEntry(Entry):
    pass

class MyDraftForm(DraftForm):
    pass

