import simplejson
import re

from rexrunner.response import BadRequestError
from rexrunner.registry import register_command
from rexrunner.command import Command
from rex.instrument import Assessment
from webob import Response

class FormBuilderBaseCommand(Command):

    def check_name(self, name):
        if re.match(r"^[a-zA-Z0-9_\-]+$", name):
            return True
        return False

    def __init__(self, parent):
        super(FormBuilderBaseCommand, self).__init__(parent)
        self.handler = self.parent.app.handler_by_name['rex.formbuilder']

@register_command
class TestInstrument(FormBuilderBaseCommand):

    name = '/test'
    template = '/roadsbuilder_test.html'

    def render(self, req):
        instrument = req.POST.get('instrument')
        json = req.POST.get('json')
        if not instrument:
            return Response(status='401', body='Instrument ID is not provided')
        if not self.check_name(instrument):
            raise BadRequestError(detail='Wrong instrument name')
        if not json:
            return Response(status='401', body='Instrument JSON is not provided')
        code = simplejson.loads(json)
        assessment = Assessment.empty_data()
        args = {
            'instrument': {
                'id': instrument,
                'json': simplejson.dumps(code),
            },
            'assessment': {
                'id': 'test',
                'json': simplejson.dumps(assessment)
            }
        }
        return self.render_to_response(self.template, **args)

@register_command
class FormList(FormBuilderBaseCommand):

    name = '/instrument_list'

    def render(self, req):
        # self.set_handler()
        res = self.handler.get_list_of_forms()
        return Response(body=simplejson.dumps(res))


@register_command
class LoadForm(FormBuilderBaseCommand):

    name = '/load_instrument'

    def render(self, req):
        # self.set_handler()
        code = req.GET.get('code')
        if not code:
            return Response(status='401', body='Code not provided')
        form, _ = self.handler.get_latest_instrument(code)
        if not form:
            return Response(body='Form not found')
        return Response(body=form)

@register_command
class SaveInstrument(FormBuilderBaseCommand):

    name = '/save'

    def render(self, req):
        instrument = req.POST.get('instrument')
        data = req.POST.get('data')
        if not instrument or not data:
            raise BadRequestError(detail='Missed instrument details')
        if not self.check_name(instrument):
            raise BadRequestError(detail='Wrong instrument name')
        # TODO: validate instrument
        if not self.handler.save_instrument(instrument, data):
            raise BadRequestError(detail='Could not write instrument data')
        return Response(body='OK')

@register_command
class DummySaveAssessment(FormBuilderBaseCommand):

    name = '/save_assessment'

    def render(self, req):
        return Response(body='{"result" : true}')

@register_command
class RoadsBuilder(FormBuilderBaseCommand):

    name = '/builder'

    def render(self, req):
        instrument = req.GET.get('instrument')
        if not instrument:
            return Response(status='401', body='Instrument ID is not provided')
        if not self.check_name(instrument):
            raise BadRequestError(detail='Wrong instrument name')
        (code, _) = self.handler.get_latest_instrument(instrument)
        code = simplejson.loads(code)
        # if not form:
        #    return Response(body='Form not found')

        args = {
            'instrument': instrument,
            'code': code,
            'req': req,
            'manual_edit_conditions': self.app.config.manual_edit_conditions
        }

        return self.render_to_response('/roadsbuilder.html', **args)
