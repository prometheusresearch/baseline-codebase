
import os
import re
import simplejson
import itertools
from rex.validate import make_assessment_schema, ValidationError, validate, \
                         instrument_schema

class BaseInstrumentRegistry(object):

    def get_instrument(self, id, version=None):
        assert False, 'Implement in subclasses'

    @property
    def all_instruments(self):
        assert False, 'Implement in subclasses'

    @property
    def latest_instruments(self):
        assert False, 'Implement in subclasses'

class InstrumentRegistry(BaseInstrumentRegistry):

    def __init__(self, directory):
        assert os.path.isdir(directory)
        self.directory = directory
        self._instruments = {}
        for id in os.listdir(directory):
            if id in ('.', '..'):
                continue
            path = os.path.join(directory, id)
            if os.path.isdir(path):
                versions = []
                for instrument in os.listdir(path):
                    res = re.search(r'^(\d+)\.js$', instrument)
                    if res:
                        instrument_path = os.path.join(path, instrument)
                        versions.append(Instrument(id=id,
                                             json=open(instrument_path).read(),
                                             version=int(res.group(1))))
                if versions:
                    self._instruments[id] = sorted(versions, 
                                             key=lambda f: -f.version)

    def get_instrument(self, id, version=None):
        versions = self._instruments.get(id)
        if versions is None:
            return None
        if version is None:
            return versions[0]
        for instrument in versions:
            if instrument.version == version:
                return instrument
        return None

    @property
    def all_instruments(self):
        return itertools.chain(*(self._instruments.values()))

    @property
    def latest_instruments(self):
        for key in sorted(self._instruments.keys()):
            yield self._instruments[key][0]


class Instrument(object):
    
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
        try:
            validate(instrument_schema, self.data)
        except ValidationError:
            print 'Instrument %s of version %s is incorrect' % (id, version) 
            raise
        self.assessment_schema = make_assessment_schema(self.data)

    def validate(self, data):
        validate(self.assessment_schema, data) 
