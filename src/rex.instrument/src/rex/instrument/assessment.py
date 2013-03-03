

import os
import glob
import simplejson
import shutil
from .instrument import InstrumentRegistry, Instrument
from .util import FileLock, savefile

# do not change these values unless you know what you're doing
IN_PROGRESS = 'in-progress'
COMPLETED = 'completed'

class AssessmentStorageError(Exception):
    pass


class Assessment(object):

    valid_statuses = [IN_PROGRESS, COMPLETED]

    def __init__(self, id, instrument, data, status, last_modified):
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
        # TODO: validate
        self.data = data
        

class BaseAssessmentStorage(object):
   pass


class AssessmentStorage(BaseAssessmentStorage):

    # do not change these values unless you know what you're doing
    V = 5 # digits for instrument version in a file name
    N = 6 # digits for assessment number within the instrument
    LOCK_FORM_DIR = 'lock_instrument'
    LOCK_ASSESSMENT_DIR = 'lock_assessment'
    IN_PROGRESS_DIR = IN_PROGRESS
    COMPLETED_DIR = COMPLETED
    
    def __init__(self, instruments, directory):
        assert isinstance(instruments, InstrumentRegistry)
        assert os.path.isdir(directory)
        directory = os.path.abspath(directory)
        self.directory = directory
        self.instruments = instruments
        self.main_lock = FileLock(os.path.join(directory, '.lock'))
        self.instrument_lock_dir = os.path.join(directory, self.LOCK_FORM_DIR)
        self.assessment_lock_dir = os.path.join(directory, 
                                                self.LOCK_ASSESSMENT_DIR)
        self.inprogress_dir = os.path.join(directory, self.IN_PROGRESS_DIR)
        self.completed_dir = os.path.join(directory, self.COMPLETED_DIR)
        self.status_lookup = [(COMPLETED, self.completed_dir), 
                              (IN_PROGRESS, self.inprogress_dir)]
        with self.main_lock:
            for instrument in instruments.latest_instruments:
                self.get_instrument_lock(instrument, create=True)

    def get_instrument_lock(self, instrument, create=False):
        path = os.path.join(self.instrument_lock_dir, instrument.id)
        try:
            return FileLock(path, create=create)
        except IOError:
            raise AssessmentStorageError("Instrument lock not found: %s" % path)

    def get_assessment_lock(self, id, create=False):
        path = os.path.join(self.assessment_lock_dir, id)
        try:
            return FileLock(path, create=create)
        except IOError:
            raise AssessmentStorageError("Assessment not found: %s" % id)

    def create_assessment_id(self, instrument_id, version, n):
        return "%s_%s_%s" % (instrument_id, 
                           str(version).rjust(self.V, '0'),
                           str(n).rjust(self.N, '0'))
    
    def parse_assessment_id(self, id):
        n = int(id[-self.N:])
        version = int(id[-self.N - 1 - self.V:][:self.N - 1])
        instrument_id = id[:-self.V - self.N - 2]
        return (instrument_id, version, n)

    def increment_assessment_id(self, instrument, id=None):
        if id is None:
            id = self.create_assessment_id(instrument.id, instrument.version, 0)
        instrument_id, _, n = self.parse_assessment_id(id)
        assert instrument_id == instrument.id
        return self.create_assessment_id(instrument.id, instrument.version, 
                                         n + 1)

    def get_last_assessment_id(self, instrument):
        names = list(reversed(self._list_assessments_by_instrument(instrument)))
        return names[0] if names else None

    def _get_assessment(self, id):
        for status, dir in self.status_lookup:
            filename = os.path.join(dir, id + '.js')
            if os.path.isfile(filename):
                instrument, version, _ = self.parse_assessment_id(id)
                instrument = self.instruments.get_instrument(instrument, 
                                                             version=version)
                return Assessment(id=id, instrument=instrument, status=status,
                                  data=simplejson.load(open(filename)),
                                  last_modified=os.path.getmtime(filename))
        return None

    def get_assessment(self, id):
        try:
            with self.get_assessment_lock(id):
                return self._get_assessment(id)
        except AssessmentStorageError:
            return None

    def _list_assessments_by_instrument(self, instrument):
        pattern = os.path.join(self.assessment_lock_dir, instrument.id) \
                  + '_' + ('[0-9]' * self.V) \
                  + '_' + ('[0-9]' * self.N)
        names = list(sorted([os.path.basename(name) 
                              for name in glob.glob(pattern)]))
        return names

    def _create_assessment(self, instrument):
        id = self.get_last_assessment_id(instrument)
        id = self.increment_assessment_id(instrument, id)
        self.get_assessment_lock(id, create=True)
        self.update_assessment(id, {})
        return self._get_assessment(id)

    def create_assessment(self, instrument):
        assert isinstance(instrument, (str, unicode, Instrument))
        if isinstance(instrument, (str, unicode)):
            instrument = self.instruments.get_instrument(instrument)
        assert instrument is not None
        with self.get_instrument_lock(instrument):
            return self._create_assessment(instrument)

    def update_assessment(self, id, data):
        with self.get_assessment_lock(id):
            assessment = self._get_assessment(id)
            if assessment is None:
                instrument, version, _ = self.parse_assessment_id(id)
                instrument = self.instruments.get_instrument(instrument, version=version)
                assessment = Assessment(id=id, instrument=instrument, data=data,
                                        status=IN_PROGRESS, last_modified=None)
            if assessment.status != IN_PROGRESS:
                raise AssessmentStorageError("Assessment %s has "
                         "invalid status: %s" % (id, assessment.status))
            assessment.update(data)
            filename = os.path.join(self.inprogress_dir, id) + '.js'
            savefile(filename, assessment.json)

    def complete_assessment(self, id):
        with self.get_assessment_lock(id):
            assessment = self._get_assessment(id)
            if assessment is None:
                raise AssessmentStorageError("Assessment not found: %s" % id)
            if assessment.status != IN_PROGRESS:
                raise AssessmentStorageError("Assessment %s has "
                         "invalid status: %s" % (id, assessment.status))
            #TODO: assessment.complete()/validate
            with open(os.path.join(self.completed_dir, id + '.js'), 'w') as f:
                f.write(assessment.json)

    @property
    def assessments(self):
        pattern = os.path.join(self.assessment_lock_dir, '*') \
                  + '_' + ('[0-9]' * self.V) \
                  + '_' + ('[0-9]' * self.N)
        names = sorted([os.path.basename(name) 
                        for name in glob.glob(pattern)])
        for name in names:
            yield self.get_assessment(name)
         
    @property
    def completed_assessments(self):
        for assessment in self.assessments:
            if assessment.is_completed:
                yield assessment

    @classmethod
    def create(cls, directory):
        assert os.path.isdir(directory)
        directory = os.path.abspath(directory)
        for dir in (cls.COMPLETED_DIR, cls.IN_PROGRESS_DIR, 
                    cls.LOCK_FORM_DIR, cls.LOCK_ASSESSMENT_DIR):
            path = os.path.join(directory, dir)
            os.mkdir(path)
        open(os.path.join(directory, '.lock'), 'w').close()
