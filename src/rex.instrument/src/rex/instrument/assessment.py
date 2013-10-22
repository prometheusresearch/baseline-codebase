

import os
import glob
import simplejson
import shutil
import warnings
from .instrument import Instrument
from rex.validate import ValidationError

# do not change these values unless you know what you're doing
IN_PROGRESS = 'in-progress'
COMPLETED = 'completed'


class AssessmentError(Exception):
    pass


class Assessment(object):

    valid_statuses = [IN_PROGRESS, COMPLETED]

    def __init__(self, id, instrument, data, status, last_modified):
        #print 'Assessment', id, status, last_modified
        #print data
        assert isinstance(id, (str, unicode))
        assert isinstance(instrument, Instrument)
        self.id = id
        self.instrument = instrument
        self.status = status
        self.last_modified = last_modified
        self.update(data)

    @property
    def json(self):
        return simplejson.dumps(self.data, indent=2, sort_keys=True)

    @property
    def is_completed(self):
        return self.status == COMPLETED

    def update(self, data):
        try:
            self.instrument.validate(data)
        except ValidationError, exc:
            raise exc
            raise AssessmentError("Assessment data is invalid: %s"
                                  % simplejson.dumps(data))
        self.data = data

    @classmethod
    def empty_data(cls):
        return {
            'answers': {},
            'explanations': {},
            'annotations': {},
            'instrument': None,
            'version': None,
        }
