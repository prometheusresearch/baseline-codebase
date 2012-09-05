from webob import Response

import simplejson
import os, time

from rexrunner.command import Command
from rexrunner.response import BadRequestError
from rexrunner.registry import register_command

from generator import Instrument

OWNER = "/&meta_owner"

class RoadsCommand(Command):

    def set_handler(self):
        if 'client.speaks.oscr' in self.app.handler_by_name:
            self.handler = self.app.handler_by_name['client.speaks.oscr']
        else:
            self.handler = self.parent


@register_command
class InstrumentList(RoadsCommand):

    name = '/instrument_list'

    def render(self, req):
        self.set_handler()
        res = self.handler.get_list_of_instruments()
        return Response(body=simplejson.dumps(res))


@register_command
class LoadInstrument(RoadsCommand):

    name = '/load_instrument'

    def render(self, req):
        self.set_handler()
        code = req.GET.get('code')
        if not code:
            return Response(status='401', body='Code not provided')
        instrument, _ = self.handler.get_latest_instrument(code)
        if not instrument:
            return Response(body='Instrument not found')
        return Response(body=instrument)


@register_command
class AddInstrument(RoadsCommand):

    name = '/add_instrument'

    def render(self, req):
        self.set_handler()
        post = req.POST.get('data')
        instrument_name = req.POST.get('instrument')
        if not post:
            return Response(status='401', body='No POST data provided')
        if not instrument_name:
            return Response(status='401', body='Instrument code not provided')
        self.user = req.environ.get('REMOTE_USER')
        post = simplejson.loads(post)
        new_instr = Instrument(post, instrument_name)
        old_instr, version = self.handler.get_latest_instrument(new_instr.code)
        if not old_instr:
            #such instrument doesn't exist - adding it
            self.handler.store_instrument(new_instr.code, post, '1', req)
            return Response(body='Saved!')
        if not self.handler.check_packets(new_instr.code, version):
            #no packets exist
            self.handler.store_instrument(new_instr.code, post, version, req)
            return Response(body='Saved!')
        old_instr = Instrument(simplejson.loads(old_instr), instrument_name)
        for que in new_instr.questions:
            new_question = new_instr.questions[que]
            old_question = old_instr.questions.get(que)
            if not new_question.isEqual(old_question):
                #new version is needed
                version = str(int(version) + 1)
                self.handler.store_instrument(new_instr.code, post,
                                             version, req)
                return Response(body='Saved!')
        #only minor changes - replacing instrument
        self.handler.store_instrument(new_instr.code, post, version, req)
        return Response(body='Saved!')


@register_command
class SaveState(RoadsCommand):

    name = '/save_state'

    def get_user_data(self, req):
        return {}

    def render(self, req):
        self.set_handler()
        post = req.POST.get('data')
        if not post:
            return Response(status='401', body='No POST data provided')
        data = simplejson.loads(post)
        data['user_data'] = self.get_user_data(req)
        code = req.POST.get('package')
        instrument = req.POST.get('form')
        if not code and instrument:
            return Response(body='Wrong Json')
        handler = self.app.handler_by_name['rex.forms']
        _, version = handler.get_latest_instrument(instrument)
        handler.save_packet(instrument, version, code, data)
        return Response(body='Saved!')


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

    def prepare_client_params(self, req):
        extra = self.get_extra_params(req)
        instrument = self.get_instrument(req)
        test = self.get_test_mode(req)
        packet = req.GET.get('packet')
        if not test:
            if not instrument:
                raise BadRequestError('Mandatory'
                                      ' instrument not filled in')
        else:
            packet = None
        inst_json, version = self.handler.get_latest_instrument(instrument)
        if not test and not packet:
            packet = self.handler.create_packet(instrument, version, req, extra)
        state = self.handler.get_packet(instrument, version, packet)
        params = {
            'instrument' : inst_json,
            'package' : packet,
            'state' : state,
            'instrument_id' : instrument,
            'extra' : extra
        }
        return params

    def render(self, req):
        self.set_handler()
        args = {
            'client_params': self.prepare_client_params(req)
        }
        return self.render_to_response(self.template, **args)

@register_command
class MakePacket(RoadsCommand):

    name = '/make_packet'

    def render(self, req):
        self.set_handler()
        code = req.GET.get('instrument')
        if not code:
            return Response(status='401', body='Code not provided')
        _, version = self.handler.get_latest_instrument(code)
        packet = self.handler.create_packet(code, version, req)
        return Response(body=packet)

@register_command
class RoadsBuilder(RoadsCommand):

    name = '/builder'

    def render(self, req):
        self.set_handler()
        if not self.app.config.default_builder:
            return Response(status='403', body='Forbidden')

        code = req.GET.get('instrument')
        if not code:
            return Response(status='401', body='Code not provided')
        instrument, _ = self.handler.get_latest_instrument(code)

        # if not instrument:
        #    return Response(body='Instrument not found')

        args = {
            'instrument': code,
            'req': req,
            'manual_edit_conditions': self.app.config.manual_edit_conditions
        }

        return self.render_to_response('/roadsbuilder.html', **args)

