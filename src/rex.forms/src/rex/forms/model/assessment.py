

import os
import glob
import simplejson
import shutil
from .form_registry import FormRegistry, Form
from .util import FileLock, savefile

# do not change these values unless you know what you're doing
IN_PROGRESS = 'in-progress'
COMPLETED = 'completed'

class AssessmentStorageError(Exception):
    pass


class Assessment(object):

    valid_statuses = [IN_PROGRESS, COMPLETED]

    def __init__(self, id, form, data, status, last_modified):
        assert isinstance(id, (str, unicode))
        assert isinstance(form, Form)
        self.id = id
        self.form = form
        self.status = status
        self.last_modified = last_modified
        self.update(data)

    @property
    def json(self):
        return simplejson.dumps(self.data, indent=2, sort_keys=True)
        
    def update(self, data):
        # TODO: validate
        self.data = data
        

class BaseAssessmentStorage(object):
   pass


class AssessmentStorage(BaseAssessmentStorage):

    # do not change these values unless you know what you're doing
    V = 5 # digits for form version in a file name
    N = 6 # digits for assessment number within the form
    LOCK_FORM_DIR = 'lock_form'
    LOCK_ASSESSMENT_DIR = 'lock_assessment'
    IN_PROGRESS_DIR = IN_PROGRESS
    COMPLETED_DIR = COMPLETED
    
    def __init__(self, form_registry, directory):
        assert isinstance(form_registry, FormRegistry)
        assert os.path.isdir(directory)
        directory = os.path.abspath(directory)
        self.form_registry = form_registry
        self.main_lock = FileLock(os.path.join(directory, '.lock'))
        self.form_lock_dir = os.path.join(directory, self.LOCK_FORM_DIR)
        self.assessment_lock_dir = os.path.join(directory, 
                                                self.LOCK_ASSESSMENT_DIR)
        self.inprogress_dir = os.path.join(directory, self.IN_PROGRESS_DIR)
        self.completed_dir = os.path.join(directory, self.COMPLETED_DIR)
        self.status_lookup = [(COMPLETED, self.completed_dir), 
                              (IN_PROGRESS, self.inprogress_dir)]
        with self.main_lock:
            for form in form_registry.latest_forms:
                self.get_form_lock(form, create=True)

    def get_form_lock(self, form, create=False):
        path = os.path.join(self.form_lock_dir, form.id)
        try:
            return FileLock(path, create=create)
        except IOError:
            raise AssessmentStorageError("Form lock not found: %s" % path)

    def get_assessment_lock(self, id, create=False):
        path = os.path.join(self.assessment_lock_dir, id)
        try:
            return FileLock(path, create=create)
        except IOError:
            raise AssessmentStorageError("Assessment not found: %s" % id)

    def create_assessment_id(self, form_id, version, n):
        return "%s_%s_%s" % (form_id, 
                           str(version).rjust(self.V, '0'),
                           str(0).rjust(self.N, '0'))
    
    def parse_assessment_id(self, id):
        n = int(id[-self.N:])
        version = int(id[-self.N - 1 - self.V:][:self.N - 1])
        form_id = id[:-self.V - self.N - 2]
        return (form_id, version, n)

    def increment_assessment_id(self, form, id=None):
        if id is None:
            id = self.create_assessment_id(form.id, form.version, 0)
        form_id, _, n = self.parse_assessment_id(id)
        assert form_id == form.id
        return self.create_assessment_id(form.id, form.version, n + 1)

    def get_last_assessment_id(self, form):
        pattern = os.path.join(self.assessment_lock_dir, form.id) \
                  + '_' + ('[0-9]' * self.V) \
                  + '_' + ('[0-9]' * self.N) + '.js'
        names = list(reversed(sorted([os.path.basename(name) 
                              for name in glob.glob(pattern)])))
        return names[0][0:-len('.js')] if names else None

    def _get_assessment(self, id):
        for status, dir in self.status_lookup:
            filename = os.path.join(dir, id + '.js')
            if os.path.isfile(filename):
                form, version, _ = self.parse_assessment_id(id)
                form = self.form_registry.get_form(form, version=version)
                return Assessment(id=id, form=form, status=status,
                                  data=simplejson.load(open(filename)),
                                  last_modified=os.path.getmtime(filename))
        return None

    def get_assessment(self, id):
        try:
            with self.get_assessment_lock(id):
                return self._get_assessment(id)
        except AssessmentStorageError:
            return None

    def create_assessment(self, form):
        assert isinstance(form, (str, unicode, Form))
        if isinstance(form, (str, unicode)):
            form = self.form_registry.get_form(form)
        assert form is not None
        with self.get_form_lock(form): 
            id = self.get_last_assessment_id(form)
            id = self.increment_assessment_id(form, id)
            self.get_assessment_lock(id, create=True)
            self.update_assessment(id, {})
        return self.get_assessment(id)

    def update_assessment(self, id, data):
        with self.get_assessment_lock(id):
            assessment = self._get_assessment(id)
            if assessment is None:
                form, version, _ = self.parse_assessment_id(id)
                form = self.form_registry.get_form(form, version=version)
                assessment = Assessment(id=id, form=form, data=data,
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


    @classmethod
    def create(cls, directory):
        assert os.path.isdir(directory)
        directory = os.path.abspath(directory)
        for dir in (cls.COMPLETED_DIR, cls.IN_PROGRESS_DIR, 
                    cls.LOCK_FORM_DIR, cls.LOCK_ASSESSMENT_DIR):
            path = os.path.join(directory, dir)
            os.mkdir(path)
        open(os.path.join(directory, '.lock'), 'w').close()
