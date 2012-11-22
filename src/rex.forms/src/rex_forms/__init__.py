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

            files = os.walk(fld).next()[2]
            files = [int(i[:-3]) for i in files]
            if files:
                latest = max(files)
            else:
                #No forms yet exist
                return None, 0
            file_name = "%s/%d.js" % (fld, latest)
            if os.path.exists(file_name):
                f = open(file_name, "r")
                return f.read(), latest
            else:
                return None, 0

    def store_form(self, code, json, version, req):
        folder = self.app.config.form_folder
        fld = "%s/%s" % (folder, code)
        key = self.app.config.environ_user_key
        if req:
           user = req.environ.get(key, '')
        else:
            user = ''
        with self.lock:
            if not os.path.exists(fld):
                os.makedirs(fld)
            user_data = self.get_form_user_data(code)
            log = user_data.get('log', [])
            if log:
                log.append({'updated-by' : user,
                            'date' : time.strftime("%Y-%m-%d %H:%M"),
                            'version' : version})
            else:
                log.append({'created-by' : user,
                            'date' : time.strftime("%Y-%m-%d %H:%M"),
                            'version' : version})
            user_data['log'] = log
            if 'user_data' in json:
                json['user_data'].update(user_data)
            else:
                json['user_data'] = user_data
            f = open("%s/%s.js" % (fld, version), "w")
            f.write(simplejson.dumps(json, indent=1))

    def create_packet(self, code, version, req, extra):
        with self.lock:
            folder = self.app.config.form_folder
            fld = "%s/%s/packets" % (folder, code)
            if not os.path.exists(fld):
                os.makedirs(fld)
            packets = os.walk(fld).next()[2]
            if not packets:
                packet = '1'
            else:
                files = [int(i.split('_')[0]) for i in packets]
                final = max(files)
                packet = str(final + 1)
            if req:
                key = self.app.config.environ_user_key
                user = req.environ.get(key, '')
            else:
                user = ''
            log = {'created-by' : user,
                   'data-entry-status' : 'not-started',
                   'date' : time.strftime("%Y-%m-%d %H:%M")}
            data = {'version' : version,
                    'user_data' : log}
            f = open("%s/%s_%s.js" % (fld, packet, version), "w")
            f.write(simplejson.dumps(data, indent=1))
            f.close()
            return packet

    def get_packet(self, form, version, packet):
        with self.lock:
            folder = self.app.config.form_folder
            fld = "%s/%s/packets/%s_%s.js" \
                    % (folder, form, packet, version)
            if not os.path.exists(fld):
                return '{}'
            else:
                f = open(fld, 'r')
                return f.read()

    def get_packet_file_name(self, base, form, packet, version):
        return "%s/%s/packets/%s_%s.js" % (base, form, packet, version)

    def save_packet(self, form, version, packet, data):
        with self.lock:
            base_dir = self.app.config.form_folder
            file_name = self.get_packet_file_name(base_dir, form, packet, version)
            print "packet file name:", file_name
            user_data = data.get('user_data', {})
            f = open(file_name, 'r')
            old = simplejson.load(f)
            old_data = old.get('user_data')
            old_data.update(user_data)
            finished = data.get('finished')
            if finished:
                old_data['data-entry-status'] = 'complete'
            else:
                old_data['data-entry-status'] = 'in-progress'
            data['user_data'] = old_data
            f.close()
            f = open(file_name, 'w')
            f.write(simplejson.dumps(data, indent=1))
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
            file_name = "%s/%s/packets/%s_%s.js" % (folder,\
                            form, packet, version)
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
            file_name = "%s/%s/packets/%s_%s.js" % (folder,\
                             form, packet, version)
            if os.path.isfile(file_name):
                return simplejson.load(open(file_name, 'r')).get('user_data', {})
            else:
                return {}

    def set_form_user_data(self, form, user_data):
        old_data, version = self.get_latest_form(form)
        if old_data:
            old_u_data = old_data.get('user_data', {})
            for key in user_data:
                old_u_data[key] = user_data[key]
            old_data['user_data'] = old_u_data
        else:
            old_data = {'user_data': user_data}
            version = 1
        self.store_form(form, old_data, version, None, False)

    def get_form_user_data(self, form):
        data, _ = self.get_latest_form(form)
        if data:
            data = simplejson.loads(data)
            return data.get('user_data', {})
        else:
            return {}

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
        folder = "%s/%s/packets" % (folder, form)
        if os.path.exists(folder):
            lst = [str(i[:-3]) for i in os.walk(folder).next()[2]]
            res = []
            for l in lst:
                name, ver = l.split('_')
                ver = int(ver)
                if ver == version:
                    res.append(name)
            return res
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
                        'user_data' : data,
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
        return self.get_packets(code, version)

