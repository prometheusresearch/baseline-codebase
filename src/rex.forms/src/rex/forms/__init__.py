from threading import RLock

from rexrunner.registry import register_parameter, register_handler
from htsql.core.validator import DBVal, MapVal, StrVal, AnyVal, BoolVal
from rexrunner.parameter import Parameter
from rexrunner.handler import PackageHandler
from .command import *
from .model import InstrumentRegistry, AssessmentStorage

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
class InstrumentFolder(Parameter):
    """
    A path to folder where instrument meta data is stored

    Example:
      rexinstruments_instrument_folder: /instruments
    """


    name = 'rexinstruments_instrument_folder'
    validator = FolderVal(is_nullable=False, is_writable=False)
    default = None


@register_parameter
class AssessmentFolder(Parameter):
    """
    A path to folder where assessment data is stored

    Example:
      rexinstruments_assessment_folder: /assessments
    """


    name = 'rexinstruments_assessment_folder'
    validator = FolderVal(is_nullable=False, is_writable=True)
    default = None


@register_handler
class InstrumentsPackageHandler(PackageHandler):

    def __init__(self, app, package):
        super(InstrumentsPackageHandler, self).__init__(app, package)
        if app.config.rexinstruments_instrument_folder is not None \
        and app.config.rexinstruments_assessment_folder is not None:
            instruments = InstrumentRegistry(app.config.rexinstruments_instrument_folder) 
            self.assessment_storage = AssessmentStorage(instruments,
                    app.config.rexinstruments_assessment_folder)
        else:
            self.assessment_storage = None

    def get_assessment_storage(self):
        assert self.assessment_storage is not None, \
                "Only works on insecure/single person entry mode"

