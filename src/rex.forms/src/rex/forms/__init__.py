from threading import RLock

from rexrunner.registry import register_parameter, register_handler
from htsql.core.validator import DBVal, MapVal, StrVal, AnyVal, BoolVal
from rexrunner.parameter import Parameter
from rexrunner.handler import PackageHandler
from .command import *
from .model import FormRegistry, AssessmentStorage

import os
import re
import time

class FolderVal(StrVal):

    def __init__(self, is_writable=True, **kwds):
        super(FolderVal, self).__init__(**kwds)
        self.is_writable = is_writable

    def __call__(self, value):
        super(FolderVal, self).__call__(value)
        assert os.path.exists(value), "Folder does not exist"
        if self.is_writable:
            assert os.access(value, os.W_OK), "Folder should be writable"
        else:
            assert os.access(value, os.R_OK | os.X_OK), \
                   "Folder should be readable"
        return value


@register_parameter
class FormFolder(Parameter):
    """
    A path to folder where form meta data is stored

    Example:
      rexforms_form_folder: /forms
    """


    name = 'rexforms_form_folder'
    validator = FolderVal(is_nullable=False, is_writable=False)
    default = None


@register_parameter
class AssessmentFolder(Parameter):
    """
    A path to folder where assessment data is stored

    Example:
      rexforms_assessment_folder: /assessments
    """


    name = 'rexforms_assessment_folder'
    validator = FolderVal(is_nullable=False, is_writable=True)
    default = None


@register_handler
class FormsPackageHandler(PackageHandler):

    def __init__(self, app, package):
        super(FormsPackageHandler, self).__init__(app, package)
        if app.config.rexforms_form_folder is not None \
        and app.config.rexforms_assessment_folder is not None:
            form_registry = FormRegistry(app.config.rexforms_form_folder) 
            self.assessment_storage = AssessmentStorage(form_registry,
                    app.config.rexforms_assessment_folder)
        else:
            self.assessment_storage = None

    def get_assessment_storage(self):
        assert self.assessment_storage is not None, \
                "Only works on insecure/single person entry mode"

