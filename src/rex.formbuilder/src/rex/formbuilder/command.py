import simplejson
import re
import errno
from urllib import quote

from rex.web import Command, render_to_response, Parameter, authenticate
from rex.core import Validate, StrVal, get_settings
from rex.core.error import guard, Error
from rex.instrument import Assessment, BASE_INSTRUMENT_JSON
from rex.rdoma import get_db
from webob import Response
from webob.exc import HTTPBadRequest, HTTPNotFound

from htsql.core.cmd.act import produce
from htsql.core.connect import transaction
from htsql.core.error import Error as HtsqlError

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


class CreateInstrument(FormBuilderBaseCommand):

    path = '/create'
    parameters = [
        Parameter('base_measure_type', StrVal(), None),
    ]

    def render(self, req, base_measure_type):
        id = self.create_instrument(req, base_measure_type=base_measure_type)
        location = req.script_name + Builder.path + '?instrument_id=' \
                   + quote(id)
        return Response(status=303, location=location)

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
    template = 'rex.formbuilder:/template/formbuilder_test.html'
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

    path = '/'
    template = 'rex.formbuilder:/template/formbuilder_instruments.html'

    def render(self, req):
        assessment = Assessment.empty_data()
        args = {
            'role': ROLE
        }
        return render_to_response(self.template, req, **args)


class MeasureTypes(FormBuilderBaseCommand):

    path = '/measure_types'

    parameters = [
        Parameter('instrument_id', StrVal(pattern=r"^[a-zA-Z0-9_\-]+$"))
    ]

    def render(self, req, instrument_id):
        with self.get_db(req):
            try:
                product = produce("""
                    /do(
                        $base_measure_type:=
                            if_null(formbuilder[%s].base_measure_type, ''),
                        /measure_type{
                            _id :as ID,
                            _id=$base_measure_type :as default
                        }
                    )
                """ % instrument_id, instrument_id=instrument_id)
                ret = [{"id": item.ID, "default": item.default } \
                        for item in product]
            except HtsqlError as e:
                raise HTTPBadRequest(detail=repr(e))
        return Response(simplejson.dumps(ret))

class SaveInstrument(FormBuilderBaseCommand):

    path = '/save'
    parameters = [
        Parameter('instrument_id', StrVal()),
        Parameter('data', JsonVal())
    ]

    def save_instrument(self, req, instrument_id, data):
        # TODO: validate instrument
        with self.get_db(req):
            try:
                produce("""update(formbuilder[$id]{id(),
                        title := $title,
                        data := $data
                    })""", 
                    id=instrument_id,
                    title=data.get('title'), 
                    data=simplejson.dumps(data))
            except HtsqlError as e:
                raise HTTPBadRequest(detail=repr(e))

    def render(self, req, instrument_id, data):
        self.save_instrument(req, instrument_id, data)
        return Response(body='OK')


class PublishInstrument(FormBuilderBaseCommand):

    path = '/publish'
    parameters = [
        Parameter('instrument_id', StrVal()),
        Parameter('measure_type_id', StrVal())
    ]

    def publish_instrument(self, req, instrument_id, measure_type_id):
        with self.get_db(req):
            with transaction():
                instrument = produce("formbuilder[$id]{*}", 
                                     id=instrument_id).data
                if instrument is None:
                    raise HTTPNotFound(detail=("Instrument '%s' not found" 
                                               % instrument_id))
                measure_type = produce("measure_type[$id]{*}", 
                                       id=measure_type_id).data
                if measure_type is None:
                    title = simplejson.loads(instrument.data).get('title')
                    measure_type = produce("""/do(
                            $id := insert(measure_type := {
                                code := $measure_type_id,
                                title := $title
                            }),
                            measure_type[$id]{*}
                        )""",
                        measure_type_id=measure_type_id,
                        title=title).data
                last_version = produce(
                    """/measure_type_version{version}
                       .filter(measure_type=$measure_type&json=$data)""",
                    measure_type=measure_type.code,
                    data=instrument.data).data
                if not len(last_version):
                    # prevents duplicating forms
                    produce("""insert(measure_type_version := {
                            measure_type := $measure_type,
                            json := $data
                        })""", 
                        measure_type=measure_type.code, 
                        data=instrument.data)

    def render(self, req, instrument_id, measure_type_id):
        try:
            self.publish_instrument(req, instrument_id, measure_type_id)
        except HtsqlError as e:
            raise HTTPBadRequest(detail=repr(e))
        return Response(body='OK')


class DummySaveAssessment(FormBuilderBaseCommand):

    path = '/save_assessment'

    def render(self, req):
        return Response(body='{"result" : true}')


class Builder(FormBuilderBaseCommand):

    path = '/builder'
    template = 'rex.formbuilder:/template/formbuilder.html'
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
