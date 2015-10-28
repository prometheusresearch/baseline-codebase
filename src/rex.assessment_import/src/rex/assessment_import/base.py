
import os
import csv

from collections import OrderedDict
from rex.instrument.util import get_implementation
from rex.core import Error, get_settings
from .interface import Instrument, Assessment

class BaseLogging(object):

    def log(self, msg="", *args, **kwds):
        pass

    def warn(self, msg, *args, **kwds):
        pass

    def debug(self, msg, *args, **kwds):
        pass


class BaseAssessmentTemplateExport(BaseLogging):
    """
    Base class with functionality to export an InstrumentVersion from the datastore
    """

    def start(self, instrument_uid, version, output_path):
        instrument_impl = get_implementation('instrument')
        instrument = instrument_impl.get_by_uid(instrument_uid)
        if not instrument:
            raise Error('Instrument "%s" does not exist.' % (
                instrument_uid,
            ))
        if not version:
            instrument_version = instrument.latest_version
        else:
            instrument_version = instrument.get_version(version)
        if not instrument_version:
            raise Error('The desired version of "%s" does not exist.' % (
                self.instrument_uid,
            ))
        self.do_output(instrument_version, output_path)

    def do_output(self, instrument_version, output_path):
        path = os.getcwd()
        if output_path:
            path = os.path.abspath(output_path)
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

class BaseAssessmentImport(BaseLogging):

    def start(self, instrument_uid, version, input_path, tolerant=True):
        default_template_fields = \
            get_settings().assessment_template_defaults
        instrument_impl = get_implementation('instrument')
        instrument = instrument_impl.get_by_uid(instrument_uid)
        if not instrument:
            raise Error('Instrument "%s" does not exist.' % (
                instrument_uid,
            ))
        if not version:
            instrument_version = instrument.latest_version
        else:
            instrument_version = instrument.get_version(version)
        if not instrument_version:
            raise Error('The desired version of "%s" does not exist.' % (
                instrument_uid,
            ))
        instrument =  Instrument.create(instrument_version,
                                    default_template_fields)
        path = os.getcwd()
        if input_path:
            path = os.path.abspath(input_path)
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
        self.import_assessments(instrument, filepaths, tolerant)

    def import_assessments(self, instrument, import_obj_files, tolerant=True):
        imported_assessments = []
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
            imported = True
            for row in reader:
                assessment_id = row.get('assessment_id')
                if not assessment_id:
                    error_text = "Unexpected import data, `assessment_id` not found" \
                              " trougth the row #`%(i)s` of the %(filepath)s." \
                              % {'i': i, 'filepath': root_assessment_filepath}
                    if tolerant:
                        self.warn(error_text)
                        continue
                    raise Error(error_text)
                self.log("Starting assessment `%(id)s` import..."
                    % {'id': assessment_id})
                i += 1
                try:
                    assessment_data = self.make_assessment_data(assessment_id,
                                                             import_obj_files)
                    assessment_data[instrument.id] = row
                    assessment = Assessment.create(instrument,
                                                   assessment_data
                                            )
                    imported_assessments.append(assessment)
                except Exception, exc:
                    imported = False
                    self.warn(str(exc))
                    if not tolerant:
                        self.warn("Import failed.")
                        self.rollback_imported_assessments(imported_assessments)
                        raise Error("Nothing was imported")
                else:
                    self.log("Import finished, assessment `%(id)s` generated."
                        % {'id': assessment.uid})
            if not imported_assessments:
                raise Error("Nothing was imported")
            if not imported:
                self.warn("Import failed.")
                self.rollback_imported_assessments(imported_assessments)
                raise Error("Nothing was imported")

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
                    self.warn("File `%(filepath)s` contains bad formatted row"
                        " numbers # (`%(bad_num)s`,), `assessment_id` is required."
                         % {'filepath': record_list_filepath,
                            'bad_num': ', '.join(bad_num)
                         }
                    )
        return assessment

    def rollback_imported_assessments(self, assessments):
        for assessment in assessments:
            self.warn("Rollback assessment `%(assessment_uid)s`."
                      % {'assessment_uid': assessment.uid})
            assessment.delete()
