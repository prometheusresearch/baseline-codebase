from threading import Lock


from rexrunner.registry import register_parameter, register_handler
from htsql.core.validator import DBVal, MapVal, StrVal, AnyVal, BoolVal
from rexrunner.parameter import Parameter
from rexrunner.handler import PackageHandler
from .command import *

@register_parameter
class Folder(Parameter):
    name = 'instrument_folder'
    validator = StrVal(is_nullable=False)

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
        self.lock = Lock()
        print 'Custom handler'
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
            
