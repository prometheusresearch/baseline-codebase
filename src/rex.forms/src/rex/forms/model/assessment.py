
import os
from .form_registry import FormRegistry, Form


class BaseAssessmentStorage(object):
    pass


class AssessmentStorage(BaseAssessmentStorage):
    
    fn_pattern = ""

    def __init__(self, form_registry, directory):
        assert isinstance(form_registry, FormRegistry)
        assert os.path.isdir(directory)
        self.form_registry = form_registry

    def get_assessment(self, id):
        pass

    def start_assessment(self, form):
        pass 



class Assessment(object):
    pass
