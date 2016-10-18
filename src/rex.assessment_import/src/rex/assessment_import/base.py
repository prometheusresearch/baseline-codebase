
import os
import csv
import xlrd
import xlwt
import traceback

from collections import OrderedDict
from rex.ctl import env, RexTask, warn, log as base_log, debug
from rex.instrument.util import get_implementation
from rex.core import Extension, Error, get_settings
from .interface import Instrument, Assessment

import datetime

class BaseLogging(object):

    def log(self, msg="", *args, **kwds):
        if not getattr(env, 'quiet', True):
            base_log(msg, *args, **kwds)

    def warn(self, msg, *args, **kwds):
        warn(msg, *args, **kwds)

    def debug(self, msg, *args, **kwds):
        debug(msg, *args, **kwds)


class BaseAssessmentTemplateExport(BaseLogging):
    """
    Base class with functionality to export an InstrumentVersion from the datastore
    """

    def start(self, instrument_uid, version, output_path, format='csv'):
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
        self.do_output(instrument_version, output_path, format.lower())

    def do_output(self, instrument_version, output_path=None, format='csv'):
        template_writer = self.get_template_writer(format)
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
        template_writer(instrument, path)

    def get_template_writer(self, format):
        template_writer = AssessmentTemplateOutput.mapped().get(format)
        if not template_writer:
            raise Error("Format `%s` is unknown." % format)
        return template_writer()


class AssessmentTemplateOutput(BaseLogging, Extension):

    name = None

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'AssessmentTemplateOutput':
            assert cls.__call__ != AssessmentTemplateOutput.__call__, \
                'abstract method %s.__call__()' % cls

    def __call__(self, instrument, output_path):
        raise NotImplementedError()


class AssessmentCSVTemplateOutput(AssessmentTemplateOutput):

    name = 'csv'

    def __call__(self, instrument, output_path):
        for (obj_id, template) in instrument.template.items():
            filepath = os.path.join(output_path, '%s.csv' % obj_id)
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


class AssessmentXLSTemplateOutput(AssessmentTemplateOutput):

    name = 'xls'

    def __call__(self, instrument, output_path):
        workbook = xlwt.Workbook()
        for idx, (obj_id, template) in enumerate(instrument.template.items()):
            sheet = workbook.add_sheet(str(idx))
            sheet.row(0).write(0, obj_id)
            for (idx, key) in enumerate(template.keys()):
                sheet.row(1).write(idx, key)
                value = template[key]['description']
                sheet.row(2).write(idx, value)
        workbook.save(os.path.join(output_path, '%s.xls' % instrument.id))


class BaseAssessmentImport(BaseLogging):

    def start(self, instrument_uid, version, input_path,
              tolerant=True, format=None
    ):
        if not input_path:
            input_path = '.'
        if not format: format = 'csv'
        if os.path.isfile(input_path):
            _, ext = os.path.splitext(input_path)
            if ext: format = ext[1:]
        instrument = self.get_instrument(instrument_uid, version)
        importer_impl = self.get_importer(instrument, tolerant, format)
        importer_impl(input_path)

    def get_instrument(self, instrument_uid, version):
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
                                        default_template_fields
                      )
        return instrument

    def get_importer(self, instrument, tolerant, format):
        importer = AssessmentImporter.mapped().get(format)
        if not importer:
            raise Error("%s is unknown format." % format)
        return importer(instrument, tolerant)


class AssessmentImporter(BaseLogging, Extension):
    name = None

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'AssessmentImporter':
            assert cls.__call__ != AssessmentImporter.__call__, \
                'abstract method %s.__call__()' % cls

    def __init__(self, instrument, tolerant):
        self.instrument = instrument
        self.tolerant = tolerant

    def __call__(self, input):
        raise NotImplementedError()

    def import_data(self, input):
        assessment_data = self.generate_assessment_data(input)
        assessments = []
        for assessment_id, data in assessment_data.items():
            if not data: continue
            assessment = Assessment.create(self.instrument, data)
            assessments.append(assessment)
        assessment_impl = get_implementation('assessment')
        assessment_impl.bulk_create(assessments)

    def generate_assessment_data(self, input):
        raise NotImplementedError()


class AssessmentCSVImporter(AssessmentImporter):

    name = 'csv'

    def __call__(self, input):
        input_data = self.process_input(input)
        self.import_data(input_data)

    def process_input(self, input):
        input_files = {}
        path = os.getcwd()
        if input:
            path = os.path.abspath(input)
        if not os.path.exists(path):
            raise Error('Input path "%s" not found.' % path)
        if os.path.isfile(path):
            obj_id = os.path.basename(path).rsplit('.', 1)[0]
            input_files[obj_id] = path
        elif os.path.isdir(path):
            if not os.access(path, os.R_OK):
                raise Error('Directory "%s" is forbidden for reading' % path)
            for filename in os.listdir(path):
                filepath = os.path.join(path, filename)
                if os.path.isfile(filepath):
                    name, ext = os.path.splitext(filename)
                    if ext != '.csv':
                        continue
                    if name in self.instrument.template:
                        input_files[name] = filepath
        if not input_files:
            raise Error("Not found any csv file appropriate to import.")
        if len(input_files) == 1 and self.instrument.id not in input_files:
            input_files = {self.instrument.id: input_files.values()[0]}
        return input_files

    def generate_assessment_data(self, input_files):
        assessments = OrderedDict()
        for rec_id, rec_file in input_files.items():
            with open(rec_file, 'rU') as _file:
                try:
                    reader = csv.DictReader(_file)
                except Exception:
                    exc = traceback.format_exc()
                    raise Error("Got unexpected csv file `%(filepath)s`."
                                % {'filepath': rec_file}, exc
                    )
                for idx, row in enumerate(reader):
                    assessment_id = row.get('assessment_id')
                    if not assessment_id:
                        raise Error("assessment_id not found through"
                                   " `%(filepath)s` row %(idx)s"
                                   % {'filepath': rec_file, 'idx': idx})
                    assessment = assessments.get(assessment_id, OrderedDict())
                    record = assessment.get(rec_id, [])
                    if rec_id == self.instrument.id:
                        record = row
                    else:
                        record.append(row)
                    assessment[rec_id] = record
                    assessments[assessment_id] = assessment
        return assessments


class AssessmentXLSImporter(AssessmentImporter):
    name = 'xls'

    def __call__(self, input):
        input_data = self.process_input(input)
        self.import_data(input_data)

    def process_input(self, input):
        if not input:
            raise Error('Input file is expected.')
        path = os.path.abspath(input)
        if not os.path.exists(path):
            raise Error('Input path `%s` not found.' % path)
        if not os.path.isfile(path):
            raise Error('Unexpected input `%s`, xls file is expected.' % input)
        try:
            workbook = xlrd.open_workbook(path)
        except xlrd.XLRDError, exc:
            raise Error("Bad xls file `%s`." % input, exc)
        return workbook

    def generate_assessment_data(self, workbook):
        assessments = OrderedDict()
        for sheet_idx, sheet in enumerate(workbook.sheets()):
            if sheet.nrows < 3:
                raise Error("Sheet[0] has to keep at least 3 rows;"
                            " where 1st row - a sheet name,"
                            " 2nd - data header,  3rd - data."
                )
            header = self.sheet_header(sheet)
            record_id = sheet.cell_value(0, 0)
            if not record_id or record_id not in self.instrument.template:
                raise Error("Unexpected sheet # %(sheet_num)s,"
                            " record.id is expected as a value of cell(0, 0)."
                            %  {'sheet_num': sheet_idx}
                )
            if 'assessment_id' not in header:
                raise Error("Not found `assessment_id` trough sheet"
                            " # %(sheet_num)s of record `%(record_id)s`."
                            % {'sheet_num': sheet_idx,
                               'record_id': record_id
                              }
                )
            record = []
            for row_idx in range(2, sheet.nrows):
                row = self.get_row(sheet, row_idx)
                assessment_id = row['assessment_id']
                assessment = assessments.get(assessment_id, OrderedDict())
                record = assessment.get(record_id, [])
                if record_id == self.instrument.id:
                    record = row
                else:
                    record.append(row)
                assessment[record_id] = record
                assessments[assessment_id] = assessment
        return assessments

    def get_row(self, sheet, row_idx):
        headers = dict( (i, sheet.cell_value(1, i) ) for i in range(sheet.ncols) )
        return dict( (headers[j], sheet.cell_value(row_idx, j)) for j in headers )

    def sheet_header(self, sheet):
        return [ sheet.cell_value(1, i) for i in range(sheet.ncols) ]
