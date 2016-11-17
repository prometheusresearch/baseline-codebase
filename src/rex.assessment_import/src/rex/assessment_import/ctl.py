import os
import zipfile
from collections import OrderedDict

from rex.core import Error, get_settings
from rex.ctl import Task, RexTask, argument, option


from .import_package import ImportPackage
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
            template = export_template(instrument_uid=self.instrument_uid,
                                       version=self.version,
                                       verbose=self.verbose)
            if not self.format or self.format == 'csv':
                filename, filecontent = template.as_zip_file()
            elif self.format == 'xls':
                filename, filecontent = template.as_xls_file()
            else:
                raise Error("Format %s is unknown." % self.format)
            if not self.output:
                self.output = '.'
            output = os.path.abspath(self.output)
            if not os.path.exists(output):
                os.mkdir(output)
            filepath = os.path.join(output, filename)
            with open(filepath, 'w') as f:
                f.write(filecontent)


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
        input = self.input
        if not input:
            input = '.'
        input = os.path.abspath(input)
        if not os.path.exists(input):
            raise Error("Input path `%s` does not exists" % input)
        with self.make():
            (_, ext) = os.path.splitext(input)
            if os.path.isdir(input):
                input = ImportPackage.from_directory(input)
            elif zipfile.is_zipfile(input):
                input = ImportPackage.from_zip(input)
            elif os.path.isfile(input) and ext == '.csv':
                input = ImportPackage.from_zip(input)
            elif os.path.isfile(input) and ext == '.xls':
                input = ImportPackage.from_xls(input)
            import_assessment(instrument_uid=self.instrument_uid,
                              version=self.version,
                              input=input,
                              verbose=self.verbose)
