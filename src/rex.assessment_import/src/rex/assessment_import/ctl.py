import os
import csv
import codecs
from collections import OrderedDict

from rex.core import Error, get_settings
from rex.ctl import Task, RexTask, argument, option, warn, log, debug
from .core import export_template, import_assessment


class AssessmentTemplateExportTask(RexTask):

    """
    exports an InstrumentVersion from the datastore

    The assessment-template-export task will export an InstrumentVersion from a
    project's data store and save generated output in given format,
    default format is csv.
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
            hint='the directory to keep generated files write to;'
            ' if not specified, current directory is used',
        )
        format = option(
            None,
            str,
            default='csv',
            value_name='FORMAT',
            hint='the format of output files one of csv or xls is expected;'
            ' csv is the default value',
        )
        verbose = option(
            None,
            bool,
            value_name='VERBOSE',
            hint='Show logs'
        )

    def __call__(self):
        with self.make():
            export_template(instrument_uid=self.instrument_uid,
                            version=self.version,
                            output=self.output,
                            format=self.format,
                            verbose=self.verbose)



class AssessmentImportTask(RexTask):
    """
    imports Assessment data given as a zip, bunch of csv or xls
    to the datastore.

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
            hint='the directory contained assessments data stored in csv files'
                 'or path to .xls file'
        )
        verbose = option(
            None,
            bool,
            value_name='VERBOSE',
            hint='Show logs'
        )

    def __call__(self):
        with self.make():
            import_assessment(instrument_uid=self.instrument_uid,
                              version=self.version,
                              input=self.input,
                              verbose=self.verbose)
