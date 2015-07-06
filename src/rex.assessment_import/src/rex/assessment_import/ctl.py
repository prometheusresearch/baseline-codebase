import os
import csv
from collections import OrderedDict

from rex.core import Error, get_settings
from rex.ctl import RexTask, argument, option, warn, log
from rex.instrument.util import get_implementation
from .interface import Instrument, Assessment


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
            get_settings().assessment_import_template_defaults
        instrument = Instrument.create(instrument_version,
                                       default_template_fields)
        for (obj_id, template) in instrument.template.items():
            print obj_id, template
            filepath = os.path.join(path, '%s.csv' % obj_id)
            with open(filepath, 'w') as csvfile:
                writer = csv.DictWriter(csvfile,
                            fieldnames=template.keys())
                writer.writeheader()
                writer.writerow(template)


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
        with self.make():
            default_template_fields = \
                get_settings().assessment_import_template_defaults
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
            instrument =  Instrument.create(instrument_version,
                                   default_template_fields)
            path = os.getcwd()
            if self.input:
                path = os.path.abspath(self.input)
            if not os.path.exists(path):
                raise Error('Input path "%s" not found.' % path)
            filepaths = {}
            if os.path.isfile(path):
                obj_id = os.path.basename(path).rsplit('.', 1)[0]
                filepaths[obj_id] = path
            elif os.path.isdir(path):
                if not os.access(path, os.R_OK):
                    raise Error('Directory "%s" is forbidden for reading' % path)
                for filename in os.listdir(path):
                    filepath = os.path.join(path, filename)
                    if os.path.isfile(filepath):
                        obj_id = filename.rsplit('.', 1)[0]
                        if obj_id in instrument.template:
                            filepaths[obj_id] = filepath
            if not filepaths:
                raise Error("csv files appropriate for import not found.")
            self.import_assessments(instrument, filepaths)

    def import_assessments(self, instrument, import_obj_files):
        if instrument.id not in import_obj_files:
            raise Error("csv file sufficient to the root template"
                " %(root_tpl_id)s not found."
                % {'root_tpl_id': instrument.id}
            )
        root_data_filepath = import_obj_files.pop(instrument.id)
        assessment_context = \
                get_settings().assessment_import_context
        with open(root_data_filepath, 'rU') as root_assessment_file:
            try:
                reader = csv.DictReader(root_assessment_file)
            except Exception, exc:
                raise Error("Unexpected assessment file %(filepath)s."
                            % {'filepath': root_data_filepath}, exc
                )
            for row in reader:
                assessment_id = row.get('assessment_id')
                log("Starting assessment `%(id)s` import..."
                    % {'id': assessment_id})
                try:
                    assessment_data = self.make_assessment_data(instrument.id,
                                                            row,
                                                            import_obj_files)
                    assessment = Assessment.save(instrument,
                                                 assessment_data,
                                                 assessment_context)
                except Exception, exc:
                    warn(str(exc))
                else:
                    log("Import finished, assessment `%(id)s` generated."
                        % {'id': assessment.uid})

    def make_assessment_data(self, instrument_id, assessment_root_record,
                             record_list_files):
        assessment = OrderedDict()
        assessment_id = assessment_root_record.get('assessment_id')
        if not assessment_id:
            raise Error("Unexpected import file `%(obj_tpl_id)s.csv`"
                        % {'obj_tpl_id': instrument_id},
                        "not found expected field `assessment_id`."
            )
        assessment[instrument_id] = assessment_root_record
        for (rec_obj_id, record_list_filepath) in record_list_files.items():
            with open(record_list_filepath, 'rU') as record_list_file:
                try:
                    reader = csv.DictReader(record_list_file)
                except Exception, exc:
                    raise Error("Unexpected assessment file %(filepath)s."
                                % {'filepath': record_list_filepath}, exc
                    )
                record_list_data = []
                for row in reader:
                    if row.get('assessment_id') != assessment_id:
                        continue
                    record_list_data.append(row)
                assessment[rec_obj_id] = record_list_data
        return assessment

