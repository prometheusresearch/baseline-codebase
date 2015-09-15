import os
import csv
import codecs
from collections import OrderedDict

from rex.core import Error, get_settings
from rex.ctl import RexTask, argument, option, warn, log
from rex.instrument.util import get_implementation
from .interface import Instrument, Assessment
from .base import BaseAssessmentTemplateExport, BaseAssessmentImport

class CtlLogging(object):

    def log(self, msg="", *args, **kwds):
        log(msg, *args, **kwds)

    def warn(self, msg, *args, **kwds):
        warn(msg, *args, **kwds)

    def debug(self, msg, *args, **kwds):
        debug(msg, *args, **kwds)


class AssessmentTemplateExportTask(CtlLogging, BaseAssessmentTemplateExport, RexTask):
    """
    exports an InstrumentVersion from the datastore

    The assessment-template-export task will export an InstrumentVersion from a
    project's data store and save generated output as a bunch of csv files.

    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    """

    name = 'assessment-template-export'

    class arguments(object):  # noqa
        instrument_uid = argument(str)

    class options(object):  # noqa
        version = option(
            None,
            str,
            default=None,
            value_name='VERSION',
            hint='the version of the Instrument to export template; if not specified,'
            ' defaults to the latest version',
        )

        output = option(
            None,
            str,
            default=None,
            value_name='OUTPUT_PATH',
            hint='the directory to keep generated csv files write to;'
            ' if not specified, current directory is used',
        )

    def __init__(self, *args, **kwargs):
        super(AssessmentTemplateExportTask, self).__init__(*args, **kwargs)

    def __call__(self):
        with self.make():
            self.start(self.instrument_uid, self.version, self.output)


class AssessmentImportTask(CtlLogging, BaseAssessmentImport, RexTask):
    """
    imports Assessment data given as a bunch of csv files to the datastore.

    The instrument-uid argument is the UID of the desired Instrument in
    the data store.

    """

    name = 'assessment-import'

    class arguments(object):  # noqa
        instrument_uid = argument(str)

    class options(object):  # noqa
        version = option(
            None,
            str,
            default=None,
            value_name='VERSION',
            hint='the version of the Instrument to generate assessments for;'
            ' if not specified, defaults to the latest version',
        )
        input = option(
            None,
            str,
            default=None,
            value_name='INPUT_PATH',
            hint='the directory contained assessments data stored in csv files;'
            ' if not specified, current directory is used',
        )

    def __call__(self):
        with self.make():
            self.start(self.instrument_uid, self.version, self.input)
