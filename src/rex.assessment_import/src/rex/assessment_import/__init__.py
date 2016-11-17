import os

from rex.core import get_settings, Initialize, Error
from .core import *
from .settings import *
from .import_package import *


class InitializeAssessmentImport(Initialize):
    # Verifies that `assessment_import_dir` is a valid directory and writable.

    def __call__(self):
        settings = get_settings()
        assessment_import_dir = settings.assessment_import_dir
        if assessment_import_dir is None:
            return
        if not os.path.isdir(assessment_import_dir):
            raise Error(
                "Asessment import storage (%s) does not exist:" \
                % AssessmentImportDir.name,
                assessment_import_dir)
        if not os.access(assessment_import_dir, os.R_OK|os.W_OK|os.X_OK):
            raise Error(
                "Asessment import storage (%s) is not accessible:" \
                % AssessmentImportDir.name,
                assessment_import_dir)

