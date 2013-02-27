
import os
import re
import simplejson
import itertools

class BaseFormRegistry(object):
    pass

class FormRegistry(object):

    def __init__(self, directory):
        self._forms = {}
        for id in os.listdir(directory):
            if id in ('.', '..'):
                continue
            path = os.path.join(directory, id)
            if os.path.isdir(path):
                versions = []
                for form in os.listdir(path):
                    res = re.search(r'^(\d+)\.js$', form)
                    if res:
                        form_path = os.path.join(path, form)
                        versions.append(Form(id=id,
                                             json=open(form_path).read(),
                                             version=int(res.group(1))))
                if versions:
                    self._forms[id] = sorted(versions, 
                                             key=lambda f: -f.version)

    def get_form(self, id, version=None):
        versions = self._forms.get(id)
        if versions is None:
            return None
        if version is None:
            return versions[0]
        for form in versions:
            if form.version == version:
                return form
        return None

    @property
    def all_forms(self):
        return itertools.chain(*(self._forms.values()))

    @property
    def latest_forms(self):
        for key in sorted(self._forms.keys()):
            yield self._forms[key][0]


class Form(object):
    
    def __init__(self, id, version, json=None, data=None):
        assert isinstance(id, (str, unicode))
        assert isinstance(version, int)
        assert json is None and data is not None \
               or json is not None and data is None, \
               "Only one of 'json' and 'data' parameters is expected"
        if json is not None:
            assert isinstance(json, (str, unicode))
            self.json = json
            self.data = simplejson.loads(json)
        if data is not None:
            assert isinstance(data, dict)
            self.data = data
            self.json = simplejson.dumps(data, sort_keys=True)
        self.id = id
        self.version = version
        # TODO: validation
