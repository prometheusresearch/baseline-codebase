import simplejson
import re
import errno

from rex.web import Command, render_to_response, Parameter, authenticate
from rex.core import Validate, StrVal, get_settings
from rex.core.error import guard, Error
from rex.instrument import Assessment, BASE_INSTRUMENT_JSON
from rex.rdoma import get_db
from webob import Response
from webob.exc import HTTPBadRequest, HTTPNotFound

from htsql.core.cmd.act import produce
from htsql.core.connect import transaction

ROLE = 'rex.study_access'


class JsonVal(Validate):

    def __call__(self, data):
        with guard("Got:", repr(data)):
            try:
                return simplejson.loads(data)
            except simplejson.decoder.JSONDecodeError as e:
                raise Error(e.message)
        

class FormBuilderBaseCommand(Command):

    def get_db(self, req):
        user = authenticate(req)
        return get_db(user=user, role=ROLE)

    def get_instrument(self, req, instrument_id):
        with self.get_db(req):
            product = produce('/formbuilder{*}?_id=$id', id=instrument_id)
            if not len(product.data):
                raise HTTPNotFound(detail=("Instrument '%s' not found" 
                                           % instrument_id))
            return product.data[0]

    def save_instrument(self, instrument, code):
        try:
            filename = self.instrument_filename(instrument)
            with open(filename, 'w') as f:
                f.write(code)
            return True
        except IOError as e:
            return False


class CreateInstrument(FormBuilderBaseCommand):

    path = '/create'
    parameters = [
        Parameter('base_measure_type', StrVal(), None),
    ]

    def render(self, req, base_measure_type):
        id = self.create_instrument(req, base_measure_type=base_measure_type)
        # TODO: redirect to roadsbuilder
        return Response(body=str(id))

    def create_instrument(self, req, base_measure_type=None):
        with self.get_db(req):
            with transaction():
                data = BASE_INSTRUMENT_JSON
                if base_measure_type is not None:
                    product = produce("""/measure_type.filter(_id=$type)
                        .top(measure_type_version.sort(version))
                        .json""",
                        type=base_measure_type)
                    if not len(product):
                        raise HTTPBadRequest(
                                detail=("Measure Type '%s' not found"
                                        % base_measure_type))
                    else:
                        data = product.data[0] 
                product = produce("""insert(formbuilder := {
                        base_measure_type := $base_measure_type,
                        data := $data
                    })""", 
                    base_measure_type=base_measure_type, 
                    data=data)
                return str(product.data)


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
        Parameter('instrument_id', StrVal(pattern=r"^[a-zA-Z0-9_\-]+$")),
    ]

    def render(self, req, instrument_id):
        instrument = self.get_instrument(req, instrument_id)
        args = {
            'instrument': instrument.code,
            'code': simplejson.loads(instrument.data),
            'manual_edit_conditions': get_settings().manual_edit_conditions
        }
        return render_to_response(self.template, req, **args)
