
import os
import re
import simplejson
import itertools
from rex.validate import make_assessment_schema, ValidationError, validate, \
                         instrument_schema

BASE_INSTRUMENT_JSON = """\
{"title": null, "pages":[]}
"""


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
