import os
import csv
import codecs
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
            get_settings().assessment_template_defaults
        instrument = Instrument.create(instrument_version,
                                       default_template_fields)
        for (obj_id, template) in instrument.template.items():
            filepath = os.path.join(path, '%s.csv' % obj_id)
            with open(filepath, 'w') as csvfile:
                writer = csv.DictWriter(csvfile,
                            fieldnames=template.keys())
                writer.writeheader()
                writer.writerow(
                    OrderedDict(
                        [(name, props['description'])
                            for (name, props) in template.items()
                        ]
                    )
                )


class AssessmentImportTask(RexTask):
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
            default_template_fields = \
                get_settings().assessment_template_defaults
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
                        filename = filename.rsplit('.', 1)
                        if len(filename) != 2 or filename[1] != 'csv':
                            continue
                        obj_id = filename[0]
                        if obj_id in instrument.template:
                            filepaths[obj_id] = filepath
            if not filepaths:
                raise Error("Not found any csv file appropriate to import.")
            self.import_assessments(instrument, filepaths)

    def import_assessments(self, instrument, import_obj_files):
        if instrument.id not in import_obj_files:
            raise Error("csv file sufficient to the root template"
                " %(root_tpl_id)s not found."
                % {'root_tpl_id': instrument.id}
            )
        root_assessment_filepath = import_obj_files.pop(instrument.id)
        with open(root_assessment_filepath, 'rU') as root_assessment_file:
            try:
                reader = csv.DictReader(root_assessment_file)
            except Exception, exc:
                raise Error("Unexpected assessment file %(filepath)s."
                            % {'filepath': root_assessment_filepath}, exc
                )
            i = 1
            for row in reader:
                assessment_id = row.get('assessment_id')
                if not assessment_id:
                    warn("Unexpected import data, `assessment_id` not found"
                         " trougth the row #`%(i)s` of the %(filepath)s."
                         % {'i': i, 'filepath': root_assessment_filepath}
                    )
                    continue
                log("Starting assessment `%(id)s` import..."
                    % {'id': assessment_id})
                i += 1
                try:
                    assessment_data = self.make_assessment_data(assessment_id,
                                                             import_obj_files)
                    assessment_data[instrument.id] = row
                    assessment = Assessment.create(instrument,
                                                   assessment_data
                                            )
                except Exception, exc:
                    warn(str(exc))
                else:
                    log("Import finished, assessment `%(id)s` generated."
                        % {'id': assessment.uid})

    def make_assessment_data(self, assessment_id, record_list_files):
        assessment = OrderedDict()
        for (rec_obj_id, record_list_filepath) in record_list_files.items():
            with open(record_list_filepath, 'rU') as record_list_file:
                try:
                    reader = csv.DictReader(record_list_file)
                except Exception, exc:
                    raise Error("Got unexpected csv file `%(filepath)s`."
                        % {'filepath': record_list_filepath}, exc
                    )
                if 'assessment_id' not in reader.fieldnames:
                    raise Error("Not found `assessment_id` trough"
                        " `%(filepath)s`."
                        % {'filepath': record_list_filepath}
                    )
                record_list_data = []
                i = 1
                bad_num = []
                for row in reader:
                    record_assessment_id = row.get('assessment_id')
                    i += 1
                    if not record_assessment_id:
                        bad_num.append(str(i))
                    if record_assessment_id != assessment_id:
                        continue
                    record_list_data.append(row)
                assessment[rec_obj_id] = record_list_data
                if bad_num:
                    warn("File `%(filepath)s` contains bad formatted row"
                        " numbers # (`%(bad_num)s`,), `assessment_id` is required."
                         % {'filepath': record_list_filepath,
                            'bad_num': ', '.join(bad_num)
                         }
                    )
        return assessment

