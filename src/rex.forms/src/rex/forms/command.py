from webob import Response

import simplejson

from rexrunner.command import Command
from rexrunner.response import BadRequestError
from rexrunner.registry import register_command


class RoadsCommand(Command):

    def set_handler(self):
        if 'client.speaks.oscr' in self.app.handler_by_name:
            self.handler = self.app.handler_by_name['client.speaks.oscr']
        else:
            self.handler = self.app.handler_by_name['rex.forms']


@register_command
class SaveState(RoadsCommand):

    name = '/save_state'

    def get_user_data(self, req):
        return {}

    def get_packet(self, req):
        code = req.POST.get('package')

    def get_instrument(self, req):
        instrument = req.POST.get('instrument')

    def render(self, req):
        self.set_handler()
        post = req.POST.get('data')
        if not post:
            return Response(status='401', body='No POST data provided')
        data = simplejson.loads(post)
        data['user_data'] = self.get_user_data(req)
        code = self.get_packet(req)
        instrument = self.get_instrument(req)
        if not code and instrument:
            return Response(body='Wrong Json')
        _, version = self.handler.get_latest_instrument(instrument)
        self.handler.save_packet(instrument, version, code, data)
        return Response(body='{"result" : true}')


@register_command
class StartRoads(RoadsCommand):

    name = '/start_roads'
    template = '/index.html'

    def get_extra_params(self, req):
        extra = {}
        for key in req.GET:
            if key.startswith('p_') and req.GET[key] is not None:
                extra[str(key)[2:]] = str(req.GET[key])
        return extra

    def get_instrument(self, req):
        return req.GET.get('instrument')

    def get_test_mode(self, req):
        return req.GET.get('test')

    def get_packet(self, req):
        return req.GET.get('packet')

    def prepare_client_params(self, req):
        extra = self.get_extra_params(req)
        instrument = self.get_instrument(req)
        test = self.get_test_mode(req)
        packet = self.get_packet(req)
        if not test:
            if not instrument:
                raise BadRequestError('Mandatory instrument not filled in')
        else:
            packet = None
        instrument_json, version = self.handler.get_latest_instrument(instrument)
        if not test and not packet:
            packet = self.handler.create_packet(instrument, version, req, extra)
        state = self.handler.get_packet(instrument, version, packet)
        params = {
            'instrument' : instrument_json,
            'package' : packet,
            'state' : state,
            'instrument_id' : instrument,
            'extra' : extra
        }
        for key in params:
            if (params[key] is not None) and isinstance(params[key], str):
                params[key] = params[key].decode("utf-8")
        return params

    def render(self, req):
        self.set_handler()
        args = {
            'client_params': self.prepare_client_params(req)
        }
        return self.render_to_response(self.template, **args)