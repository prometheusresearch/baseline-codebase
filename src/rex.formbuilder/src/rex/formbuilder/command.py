import simplejson
import re
import errno

from rex.web import Command, render_to_response, Parameter
from rex.core import Validate, StrVal, get_settings
from rex.core.error import guard, Error
from rex.instrument import Assessment
from webob import Response


class JsonVal(Validate):

    def __call__(self, data):
        with guard("Got:", repr(data)):
            try:
                return simplejson.loads(data)
            except simplejson.decoder.JSONDecodeError as e:
                raise Error(e.message)
        

class FormBuilderBaseCommand(Command):

    access = 'anybody'

    def instrument_filename(self, instrument):
        return "%s/%s.json" % (get_settings().formbuilder_instruments, 
                               instrument)

    def get_latest_instrument(self, instrument):
        try:
            filename = self.instrument_filename(instrument)
            with open(filename, 'r') as f:
                return f.read()
        except IOError as e:
            if e.errno == errno.ENOENT:
                return None

    def save_instrument(self, instrument, code):
        try:
            filename = self.instrument_filename(instrument)
            with open(filename, 'w') as f:
                f.write(code)
            return True
        except IOError as e:
            return False


class TestInstrument(FormBuilderBaseCommand):

    path = '/test'
    template = 'rex.formbuilder:/template/roadsbuilder_test.html'
    parameters = [
        Parameter('instrument', StrVal(pattern=r"^[a-zA-Z0-9_\-]+$")),
        Parameter('params', JsonVal(), default={}),
        Parameter('json', JsonVal())
    ]

    def render(self, req, instrument, params, json):
        assessment = Assessment.empty_data()
        args = {
            'instrument': {
                'id': instrument,
                'json': simplejson.dumps(json),
            },
            'assessment': {
                'id': 'test',
                'params': simplejson.dumps(params),
                'json': simplejson.dumps(assessment)
            }
        }
        return render_to_response(self.template, req, **args)


class FormList(FormBuilderBaseCommand):

    path = '/instrument_list'

    def render(self, req):
        # self.set_handler()
        res = self.handler.get_list_of_forms()
        return Response(body=simplejson.dumps(res))


class LoadForm(FormBuilderBaseCommand):

    path = '/load_instrument'
    parameters = [
        Parameter('code', StrVal())        
    ]

    def render(self, req, code):
        form = self.get_latest_instrument(code)
        if form is None:
            return Response(status=404, body='Form not found')
        return Response(body=form)


class SaveInstrument(FormBuilderBaseCommand):

    path = '/save'
    parameters = [
        Parameter('instrument', StrVal(pattern=r"^[a-zA-Z0-9_\-]+$")),
        Parameter('data', StrVal())
    ]

    def render(self, req, instrument, data):
        if not self.save_instrument(instrument, data):
            return Response(status=400, body='Could not write instrument data')
        return Response(body='OK')


class DummySaveAssessment(FormBuilderBaseCommand):

    path = '/save_assessment'

    def render(self, req):
        return Response(body='{"result" : true}')


class RoadsBuilder(FormBuilderBaseCommand):

    path = '/builder'
    template = 'rex.formbuilder:/template/roadsbuilder.html'
    parameters = [
        Parameter('instrument', StrVal(pattern=r"^[a-zA-Z0-9_\-]+$")),
    ]

    def render(self, req, instrument):
        code = self.get_latest_instrument(instrument)
        if code is None:
            return Response(status=404, body='Form not found')
        code = simplejson.loads(code)
        args = {
            'instrument': instrument,
            'code': code,
            'manual_edit_conditions': get_settings().manual_edit_conditions
        }
        return render_to_response(self.template, req, **args)
