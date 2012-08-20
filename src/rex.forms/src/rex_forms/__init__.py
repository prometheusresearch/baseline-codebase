from threading import RLock


from rexrunner.registry import register_parameter, register_handler
from htsql.core.validator import DBVal, MapVal, StrVal, AnyVal, BoolVal
from rexrunner.parameter import Parameter
from rexrunner.handler import PackageHandler
from .command import *

import os

class FolderVal(StrVal):

    def __call__(self, value):
        super(FolderVal, self).__call__(value)
        assert os.path.exists(value), "Folder does not exist"
        assert os.access(value, os.W_OK), "Folder should have be writable"
        return value


@register_parameter
class Folder(Parameter):
    name = 'instrument_folder'
    validator = FolderVal(is_nullable=False)

@register_parameter
class DefaultBuilder(Parameter):
    name = 'default_builder'
    validator = BoolVal(is_nullable=False)
    default = False

@register_parameter
class ManualEditConditions(Parameter):
    name = 'manual_edit_conditions'
    validator = BoolVal(is_nullable=False)
    default = False

@register_parameter
class EnvironUserKey(Parameter):
    name = 'environ_user_key'
    validator = StrVal(is_nullable=False)

@register_handler
class FormsPackageHandler(PackageHandler):

    def __init__(self, app, package):
        self.lock = RLock()
        super(FormsPackageHandler, self).__init__(app, package)

    def get_latest_instrument(self, code):
        folder = self.app.config.instrument_folder
        fld = "%s/%s" % (folder, code)
        with self.lock:
            if not os.path.exists(fld):
                os.makedirs(fld)
                return None, 0
            dirs = os.walk(fld).next()[1]
            if not dirs:
                #No instruments yet exist
                return None, 0
            latest = dirs[-1]
            file_name = "%s/%s/instrument.js" % (fld, latest)
            if os.path.exists(file_name):
                f = open("%s/%s/instrument.js" % (fld, latest), "r")
                return f.read(), latest
            else:
                return None, 0

    def store_instrument(self, code, json, version, req):
        folder = self.app.config.instrument_folder
        fld = "%s/%s/%s" % (folder, code, version)
        key = self.app.config.environ_user_key
        user = req.environ.get(key, '')
        with self.lock:
            if not os.path.exists(fld):
                os.makedirs(fld)
            log_path = "%s/%s/change_log.yaml" % (folder, code)
            if os.path.exists(log_path):
                log = simplejson.load(open(log_path, 'r'))
            else:
                log = []
            if log:
                log.append({'updated-by' : user,
                            'date' : time.strftime("%Y-%m-%d %H:%M"),
                            'version' : version})
            else:
                log.append({'created-by' : user,
                            'date' : time.strftime("%Y-%m-%d %H:%M"),
                            'version' : version})
            f = open(log_path, 'w')
            f.write(simplejson.dumps(log, indent=1))
            f = open("%s/instrument.js" % fld, "w")
            f.write(simplejson.dumps(json, indent=1))

    def create_packet(self, code, version, req):
        with self.lock:
            folder = self.app.config.instrument_folder
            fld = "%s/%s/%s/packets_details" % (folder, code, version)
            if not os.path.exists(fld):
                os.makedirs(fld)
            fld = "%s/%s/%s/packets" % (folder, code, version)
            if not os.path.exists(fld):
                os.makedirs(fld)
            packets = os.walk(fld).next()[2]
            if not packets:
                packet = '1'
            else:
                files = [int(i[:-3]) for i in packets]
                final = max(files)
                packet = str(final + 1)
            f = open("%s/%s.js" % (fld, packet), "w")
            f.write('{}')
            f.close()
            fld = "%s/%s/%s/packets_details" % (folder, code, version)
            f = open("%s/%s.js" % (fld, packet), "w")
            key = self.app.config.environ_user_key
            user = req.environ.get(key, '')
            log = {'created-by' : user,
                   'data-entry-status' : 'not-started',
                   'date' : time.strftime("%Y-%m-%d %H:%M")}
            f.write(simplejson.dumps(log, indent=1))
            f.close()
            return packet

    def get_packet(self, instrument, version, packet):
        with self.lock:
            folder = self.app.config.instrument_folder
            fld = "%s/%s/%s/packets/%s.js" % (folder, instrument, version, packet)
            if not os.path.exists(fld):
                return '{}'
            else:
                f = open(fld, 'r')
                return f.read()

    def save_packet(self, instrument, version, packet, data):
        with self.lock:
            folder = self.app.config.instrument_folder
            fld = "%s/%s/%s/packets/%s.js" % (folder, instrument, version, packet)
            f = open(fld, 'w')
            f.write(simplejson.dumps(data, indent=1))
            f.close()
            fld = "%s/%s/%s/packets_details/%s.js" % (folder, instrument,\
                                                      version, packet)
            log = simplejson.load(open(fld, 'r'))
            finished = data.get('finish')
            if not finished:
                log['data-entry-status'] = 'in-progress'
            else:
                log['data-entry-status'] = 'complete'
            f = open(fld, "w")
            f.write(simplejson.dumps(log, indent=1))
            f.close()

    def get_list_of_instruments(self):
        folder = self.app.config.instrument_folder
        if os.path.exists(folder):
            return os.walk(folder).next()[1]
        else:
            return []

    def set_packet_user_data(self, instrument, packet, user_data):
        with self.lock:
            folder = self.app.config.instrument_folder
            _, version = self.get_latest_instrument(instrument)
            file_name = "%s/%s/%s/packets_details/%s.js" % (folder,\
                             instrument, version, packet)
            data = simplejson.load(open(file_name, 'r'))
            data['user_data'] = user_data
            f = open(file_name, 'w')
            f.write(simplejson.dumps(data, indent=1))
            f.close()

    def get_packet_data(self, instrument, packet):
        with self.lock:
            folder = self.app.config.instrument_folder
            _, version = self.get_latest_instrument(instrument)
            file_name = "%s/%s/%s/packets_details/%s.js" % (folder,\
                             instrument, version, packet)
            if os.path.isfile(file_name):
                data = simplejson.load(open(file_name, 'r'))
            else:
                data = {}
            return data

    def set_instrument_user_data(self, instrument, user_data):
        with self.lock:
            folder = self.app.config.instrument_folder
            folder = "%s/%s/user_data.js" % (folder, instrument)
            if os.path.exists(folder):
                data = simplejson.load(open(folder, 'r'))
            else:
                data = {}
            for key in user_data:
                data[key] = user_data[key]
            f = open(folder, 'w')
            f.write(simplejson.dumps(data, indent=1))
            f.close()

    def get_instrument_user_data(self, instrument):
        with self.lock:
            folder = self.app.config.instrument_folder
            folder = "%s/%s/user_data.js" % (folder, instrument)
            try:
                data = simplejson.load(open(folder, 'r'))
            except IOError:
                data = {}
            return data

    def get_list_of_instrument_w_version(self):
        with self.lock:
            result = {}
            instruments = self.get_list_of_instruments()
            for instrument in instruments:
                _, version = self.get_latest_instrument(instrument)
                user_data = self.get_instrument_user_data(instrument)
                result[instrument] = {'version' : version,
                                      'user_data' : user_data}
        return result

    def get_packets(self, instrument, version):
        folder = self.app.config.instrument_folder
        folder = "%s/%s/%s/packets" % (folder, instrument, version)
        if os.path.exists(folder):
            return [i[:-3] for i in os.walk(folder).next()[2]]
        return []

    def get_instruments_with_packets(self, with_json=True,
                                           instrument_filter=None,
                                           packet_filter=None):
        # TODO: optimize this, currently does too many of file operations
        assert instrument_filter is None or callable(instrument_filter)
        assert packet_filter is None or callable(packet_filter)
        instruments = self.get_list_of_instruments()
        result = []
        for instrument in instruments:
            json, version = self.get_latest_instrument(instrument)
            user_data = self.get_instrument_user_data(instrument)
            packets = self.get_packets(instrument, version)
            packs = []
            for packet in packets:
                p_json = self.get_packet(instrument, version, packet)
                data = self.get_packet_data(instrument, packet)
                if packet_filter is None or packet_filter(data):
                    pack = {
                        'id' : packet,
                        'user_data' : data.get('user_data', {}),
#temporary to support packets created before this changeset
                        'data-entry-status' : data.get('data-entry-status', 'not-started'),
                        'json' : p_json
                    }
                    packs.append(pack)
            instrument = {
                'instrument' : instrument,
                'version' : version,
                'packets': packs,
                'user_data': user_data,
            }
            if with_json:
                instrument['json'] = json
            if instrument_filter is None or instrument_filter(instrument):
                result.append(instrument)
        return result
