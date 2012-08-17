from webob import Response

import simplejson
import os, time

from rexrunner.command import Command
from rexrunner.registry import register_command

from generator import Instrument

OWNER = "/&meta_owner"

class RoadsCommand(Command):

    def check_packets(self, code, version):
        folder = self.app.config.instrument_folder
        fld = "%s/%s/%s/packets" % (folder, code, version)
        return os.path.exists(fld)

@register_command
class InstrumentList(RoadsCommand):

    name = '/instrument_list'

    def render(self, req):
        res = self.parent.get_list_of_instruments()
        return Response(body=simplejson.dumps(res))


@register_command
class LoadInstrument(RoadsCommand):

    name = '/load_instrument'

    def render(self, req):
        code = req.GET.get('code')
        if not code:
            return Response(status='401', body='Code not provided')
        instrument, _ = self.parent.get_latest_instrument(code)
        if not instrument:
            return Response(body='Instrument not found')
        return Response(body=instrument)


@register_command
class AddInstrument(RoadsCommand):

    name = '/add_instrument'

    def render(self, req):
        post = req.POST.get('data')
        instrument_name = req.POST.get('instrument')
        if not post:
            return Response(status='401', body='No POST data provided')
        if not instrument_name:
            return Response(status='401', body='Instrument code not provided')
        self.user = req.environ.get('REMOTE_USER')
        post = simplejson.loads(post)
        new_instr = Instrument(post, instrument_name)
        old_instr, version = self.parent.get_latest_instrument(new_instr.code)
        if not old_instr:
            #such instrument doesn't exist - adding it
            self.parent.store_instrument(new_instr.code, post, '1', req)
            return Response(body='Saved!')
        if not self.check_packets(new_instr.code, version):
            #no packets exist
            self.parent.store_instrument(new_instr.code, post, version, req)
            return Response(body='Saved!')
        old_instr = Instrument(simplejson.loads(old_instr), instrument_name)
        for que in new_instr.questions:
            new_question = new_instr.questions[que]
            old_question = old_instr.questions.get(que)
            if not new_question.isEqual(old_question):
                #new version is needed
                version = str(int(version) + 1)
                self.parent.store_instrument(new_instr.code, post,
                                             version, req)
                return Response(body='Saved!')
        #only minor changes - replacing instrument
        self.parent.store_instrument(new_instr.code, post, version, req)
        return Response(body='Saved!')


@register_command
class SaveState(RoadsCommand):

    name = '/save_state'

    def render(self, req):
        post = req.POST.get('data')
        if not post:
            return Response(status='401', body='No POST data provided')
        data = simplejson.loads(post)
        code = data.get('package')
        instrument = data.get('instrument')
        if not code and instrument:
            return Response(body='Wrong Json')
        _, version = self.parent.get_latest_instrument(instrument)
        self.parent.save_packet(instrument, version, code, data)
        return Response(body='Saved!')


@register_command
class StartRoads(RoadsCommand):

    name = '/start_roads'

    def render(self, req):
        extra = {}
        for key in req.GET:
            if not key in ['instrument', 'test', 'packet']:
                extra[str(key)] = str(req.GET[key])
        instrument = req.GET.get('instrument')
        test = req.GET.get('test')
        packet = req.GET.get('packet')
        if not test:
            if not packet and not instrument:
                return Response(status='401', body=('Mandatory package or'
                                              ' instrument not filled in'))
        else:
            packet = None
        inst_json, version = self.parent.get_latest_instrument(instrument)
        if not test and not packet:
            packet = self.parent.create_packet(instrument, version, req)
        state = self.parent.get_packet(instrument, version, packet)
        template = '/index.html'
        args = {
                'instrument' : inst_json,
                'package' : packet,
                'state' : state,
                'instrument_id' : instrument,
                'extra' : extra
        }
        body = self.app.render_template(template, req, 'rex.forms', **args)
        return Response(body=body)

@register_command
class MakePacket(RoadsCommand):

    name = '/make_packet'

    def render(self, req):
        code = req.GET.get('instrument')
        if not code:
            return Response(status='401', body='Code not provided')
        _, version = self.parent.get_latest_instrument(code)
        packet = self.parent.create_packet(code, version, req)
        return Response(body=packet)

@register_command
class RoadsBuilder(RoadsCommand):

    name = '/builder'

    def render(self, req):
        if not self.app.config.default_builder:
            return Response(status='403', body='Forbidden')

        code = req.GET.get('instrument')
        if not code:
            return Response(status='401', body='Code not provided')
        instrument, _ = self.parent.get_latest_instrument(code)

        # if not instrument:
        #    return Response(body='Instrument not found')

        args = {
            'instrument': code,
            'req': req,
            'manual_edit_conditions': self.app.config.manual_edit_conditions
        }

        return self.render_to_response('/roadsbuilder.html', **args)

