import os
import csv
from collections import OrderedDict

from rex.core import Error, get_settings
from rex.ctl import RexTask, argument, option, warn
from rex.instrument.util import get_implementation
from .util import get_assessment_templates, import_assessment_data


class AssessmentTemplateExportTask(RexTask):
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
            hint='the version of the Instrument to retrieve; if not specified,'
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


    def __call__(self):
        with self.make():
            instrument_impl = get_implementation('instrument')
            instrument = instrument_impl.get_by_uid(self.instrument_uid)
            if not instrument:
                raise Error('Instrument "%s" does not exist.' % (
                    self.instrument_uid,
                ))

            if not self.version:
                instrument_version = instrument.latest_version
            else:
                instrument_version = instrument.get_version(self.version)
            if not instrument_version:
                raise Error('The desired version of "%s" does not exist.' % (
                    self.instrument_uid,
                ))
            self.do_output(instrument_version)

    def do_output(self, instrument_version):
        path = os.getcwd()
        if self.output:
            path = os.path.abspath(self.output)

        if not os.path.exists(path):
            try:
                os.mkdir(path)
            except OSError, exc:
                raise Error('Could not add output directory "%s"' % path,
                            exc)
        if not os.access(path, os.W_OK):
            raise Error('Directory "%s" is forbidden for writing' % path)
        default_template_fields = \
            get_settings().assessment_template_default_fields
        templates = get_assessment_templates(instrument_version,
                                             default_template_fields)
        for (obj_name, template) in templates.items():
            filepath = os.path.join(path, '%s.csv' % obj_name)
            with open(filepath, 'w') as csvfile:
                writer = csv.DictWriter(csvfile,
                            fieldnames=template.output.keys())
                writer.writeheader()
                writer.writerow(template.output)


class AssessmentImportTask(RexTask):
    """
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
            hint='the version of the Instrument to retrieve; if not specified,'
            ' defaults to the latest version',
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
        path = os.getcwd()
        if self.input:
            path = os.path.abspath(self.input)
        if not os.path.exists(path):
            raise Error('Input path "%s" not found.' % path)
        filepaths = {}
        if os.path.isfile(path):
            obj_name = os.path.basename(path).rsplit('.', 1)[0]
            filepaths[obj_name] = path
        elif os.path.isdir(path):
            if not os.access(path, os.R_OK):
                raise Error('Directory "%s" is forbidden for reading' % path)
            for filename in os.listdir(path):
                filepath = os.path.join(path, filename)
                if os.path.isfile(filepath):
                    obj_name = filename.rsplit('.', 1)[0]
                    filepaths[obj_name] = filepath
        if not filepaths:
            print "Import data not given."
        with self.make():
            instrument_impl = get_implementation('instrument')
            instrument = instrument_impl.get_by_uid(self.instrument_uid)
            if not instrument:
                raise Error('Instrument "%s" does not exist.' % (
                    self.instrument_uid,
                ))

            if not self.version:
                instrument_version = instrument.latest_version
            else:
                instrument_version = instrument.get_version(self.version)
            if not instrument_version:
                raise Error('The desired version of "%s" does not exist.' % (
                    self.instrument_uid,
                ))
            self.import_assessments(instrument_version, filepaths)

    def import_assessments(self, instrument_version, csv_import_files):
        print 'import_assessments'
        #default_template_fields = \
        #    get_settings().assessment_template_default_fields
        #assessment_additional_data = \
        #    get_settings().assessment_additional_data
        #for (obj_name, filepath) in csv_import_files.items():
        #    with open(filepath, 'rU') as assessment_data:
        #        import_assessment_data(instrument_version,
        #                               obj_name,
        #                               assessment_data,
        #                               default_template_fields,
        #                               assessment_additional_data)
