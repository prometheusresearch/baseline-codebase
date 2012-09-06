from threading import RLock

from rexrunner.registry import register_parameter, register_handler
from htsql.core.validator import DBVal, MapVal, StrVal, AnyVal, BoolVal
from rexrunner.parameter import Parameter
from rexrunner.handler import PackageHandler
from .command import *

import os
import re

class FolderVal(StrVal):

    def __call__(self, value):
        super(FolderVal, self).__call__(value)
        assert os.path.exists(value), "Folder does not exist"
        assert os.access(value, os.W_OK), "Folder should have be writable"
        return value


@register_parameter
class Folder(Parameter):
    """
    A path to folder where ROADS forms and packets are stored.

    Example:
      form_folder: /files/roads
    """


    name = 'form_folder'
    validator = FolderVal(is_nullable=False)

@register_parameter
class DefaultBuilder(Parameter):
    """
    Boolean parameter that specifies if default builder, that requires no
    auth is available. Defaults to False.

    Example:
      default_builder: True
    """
    name = 'default_builder'
    validator = BoolVal(is_nullable=False)
    default = False

@register_parameter
class ManualEditConditions(Parameter):
    """
    Boolean parameter that specifies if it is allowed to manually edit 
    conditions in Roads builder. By default, user is allowed only to use
    conditions wizard.

    Example:
      manual_edit_conditions: True
    """
    name = 'manual_edit_conditions'
    validator = BoolVal(is_nullable=False)
    default = False

@register_parameter
class EnvironUserKey(Parameter):
    """
    Key in environ that ROADS expects to have logged in username

    Example:
      environ_user_key: REMOTE_USER
    """
    name = 'environ_user_key'
    validator = StrVal(is_nullable=False)

@register_handler
class FormsPackageHandler(PackageHandler):

    def __init__(self, app, package):
        self.lock = RLock()
        super(FormsPackageHandler, self).__init__(app, package)

    def get_latest_form(self, code):
        folder = self.app.config.form_folder
        fld = "%s/%s" % (folder, code)
        with self.lock:
            if not os.path.exists(fld):
                os.makedirs(fld)
                return None, 0
            dirs = os.walk(fld).next()[1]
            latest = -1
            target_reg_exp = re.compile('^\d+$')
            for dir_name in dirs:
                if target_reg_exp.match(dir_name):
                    dir_ver = int(dir_name)
                    if dir_ver > latest:
                        latest = dir_ver
            if latest == -1:
                #No forms yet exist
                return None, 0
            file_name = "%s/%d/instrument.js" % (fld, latest)
            if os.path.exists(file_name):
                f = open("%s/%d/instrument.js" % (fld, latest), "r")
                return f.read(), latest
            else:
                return None, 0

    def store_form(self, code, json, version, req):
        folder = self.app.config.form_folder
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

    def create_packet(self, code, version, req, extra):
        with self.lock:
            folder = self.app.config.form_folder
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

    def get_packet(self, form, version, packet):
        with self.lock:
            folder = self.app.config.form_folder
            fld = "%s/%s/%s/packets/%s.js" \
                    % (folder, form, version, packet)
            if not os.path.exists(fld):
                return '{}'
            else:
                f = open(fld, 'r')
                return f.read()

    def save_packet(self, form, version, packet, data):
        with self.lock:
            folder = self.app.config.form_folder
            fld = "%s/%s/%s/packets/%s.js"\
                    % (folder, form, version, packet)
            user_data = data.pop('user_data', {})
            f = open(fld, 'w')
            f.write(simplejson.dumps(data, indent=1))
            f.close()
            fld = "%s/%s/%s/packets_details/%s.js" % (folder, form,\
                                                      version, packet)
            log = simplejson.load(open(fld, 'r'))
            finished = data.get('finish')
            if not finished:
                log['data-entry-status'] = 'in-progress'
            else:
                log['data-entry-status'] = 'complete'
            if 'user_data' in log:
                log['user_data'].update(user_data)
            else:
                log['user_data'] = user_data
            f = open(fld, "w")
            f.write(simplejson.dumps(log, indent=1))
            f.close()

    def get_list_of_forms(self):
        folder = self.app.config.form_folder
        if os.path.exists(folder):
            return os.walk(folder).next()[1]
        else:
            return []

    def set_packet_user_data(self, form, packet, user_data):
        with self.lock:
            folder = self.app.config.form_folder
            _, version = self.get_latest_form(form)
            file_name = "%s/%s/%s/packets_details/%s.js" % (folder,\
                            form, version, packet)
            data = simplejson.load(open(file_name, 'r'))
            if 'user_data' in data:
                data['user_data'].update(user_data)
            else:
                data['user_data'] = user_data
            f = open(file_name, 'w')
            f.write(simplejson.dumps(data, indent=1))
            f.close()

    def get_packet_data(self, form, packet):
        with self.lock:
            folder = self.app.config.form_folder
            _, version = self.get_latest_form(form)
            file_name = "%s/%s/%s/packets_details/%s.js" % (folder,\
                             form, version, packet)
            if os.path.isfile(file_name):
                data = simplejson.load(open(file_name, 'r'))
            else:
                data = {}
            return data

    def set_form_user_data(self, form, user_data):
        with self.lock:
            folder = self.app.config.form_folder
            folder = "%s/%s/user_data.js" % (folder, form)
            if os.path.exists(folder):
                data = simplejson.load(open(folder, 'r'))
            else:
                data = {}
            for key in user_data:
                data[key] = user_data[key]
            f = open(folder, 'w')
            f.write(simplejson.dumps(data, indent=1))
            f.close()

    def get_form_user_data(self, form):
        with self.lock:
            folder = self.app.config.form_folder
            folder = "%s/%s/user_data.js" % (folder, form)
            try:
                data = simplejson.load(open(folder, 'r'))
            except IOError:
                data = {}
            return data

    def get_list_of_forms_w_version(self):
        with self.lock:
            result = {}
            forms = self.get_list_of_forms()
            for form in forms:
                _, version = self.get_latest_form(form)
                user_data = self.get_form_user_data(form)
                result[form] = {'version' : version,
                                'user_data' : user_data}
        return result

    def get_packets(self, form, version):
        folder = self.app.config.form_folder
        folder = "%s/%s/%s/packets" % (folder, form, version)
        if os.path.exists(folder):
            return [i[:-3] for i in os.walk(folder).next()[2]]
        return []

    def get_forms_with_packets(self, with_json=True,
                               form_filter=None,
                               packet_filter=None):
        #TODO: optimize this, currently does too many of file operations
        assert form_filter is None or callable(form_filter)
        assert packet_filter is None or callable(packet_filter)
        forms = self.get_list_of_forms()
        result = []
        for form in forms:
            json, version = self.get_latest_form(form)
            user_data = self.get_form_user_data(form)
            packets = self.get_packets(form, version)
            packs = []
            for packet in packets:
                p_json = self.get_packet(form, version, packet)
                data = self.get_packet_data(form, packet)
                if packet_filter is None or packet_filter(data):
                    pack = {
                        'id' : packet,
                        'user_data' : data.get('user_data', {}),
                        'data-entry-status' : data.get('data-entry-status',\
                                                       'not-started'),
                        'json' : p_json
                    }
                    packs.append(pack)
            form = {
                'instrument' : form,
                'version' : version,
                'packets': packs,
                'user_data': user_data,
            }
            if with_json:
                form['json'] = json
            if form_filter is None or form_filter(form):
                result.append(form)
        return result


    def check_packets(self, code, version):
        folder = self.app.config.form_folder
        fld = "%s/%s/%s/packets" % (folder, code, version)
        return os.path.exists(fld)

