
import os
import warnings
from .util import FileLock

class DraftCache(object):

    def __init__(self, root):
        self.root = root

    def _get_home_dir(self, uid):
        return os.path.join(self.root, uid)

    def _get_forms_dir(self, uid):
        return os.path.join(self.root, uid, 'forms')

    def _get_instrument_path(self, uid):
        return os.path.join(self._get_home_dir(uid), "instrument.yaml")

    def _get_form_path(self, uid, channel):
        return os.path.join(self._get_forms_dir(uid), "%s.yaml" % channel)

    def _get_lock(self, uid):
        filename = os.path.join(self._get_home_dir(uid), ".lock")
        return FileLock(filename, create=True)

    def get(self, uid):
        instrument_path = self._get_instrument_path(uid)
        if not os.path.exists(instrument_path):
            return None
        result = None
        try:
            lock = self._get_lock(uid)
            with lock:
                result = self._get_instrument_and_forms(uid)
        except Exception as exc:
            warnings.warn(unicode(exc), Warning)
            return None
        return result

    def _get_instrument_and_forms(self, uid):
        result = {
            "forms": {}
        }
        instrument_path = self._get_instrument_path(uid)
        with open(instrument_path, 'r') as instrument_file:
            result["instrument"] = instrument_file.read()
        forms_dir = self._get_forms_dir(uid)
        for filename in os.listdir(forms_dir):
            if filename.endswith(".yaml"):
                channel = ".".join(filename.split(".")[0:-1])
                path = os.path.join(forms_dir, filename)
                with open(path, 'r') as form_file:
                    result["forms"][channel] = form_file.read()
        return result

    def _put_instrument_and_forms(self, uid, instrument, forms):
        instrument_path = self._get_instrument_path(uid)
        with open(instrument_path, 'w') as instrument_file:
            instrument_file.write(instrument)
        forms_dir = self._get_forms_dir(uid)
        for filename in os.listdir(forms_dir):
            if filename.endswith(".yaml"):
                filename = os.path.join(forms_dir, filename)
                os.unlink(filename)
        for channel, form in forms.items():
            filename = os.path.join(forms_dir, "%s.yaml" % channel)
            with open(filename, 'w') as form_file:
                form_file.write(form)

    def put(self, uid, instrument, forms):
        home = self._get_home_dir(uid)
        forms_dir = self._get_forms_dir(uid)
        if not os.path.isdir(forms_dir):
            os.makedirs(forms_dir)
        lock = self._get_lock(uid)
        with lock:
            self._put_instrument_and_forms(uid, instrument, forms)
