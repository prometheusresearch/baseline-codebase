
import os
import csv
import xlrd
import xlwt

from collections import OrderedDict
from rex.ctl import RexTask, warn, log, debug
from rex.instrument.util import get_implementation
from rex.core import Extension, Error, get_settings
from .interface import Instrument, Assessment


class BaseLogging(object):

    def log(self, msg="", *args, **kwds):
        log(msg, *args, **kwds)

    def warn(self, msg, *args, **kwds):
        warn(msg, *args, **kwds)

    def debug(self, msg, *args, **kwds):
        debug(msg, *args, **kwds)
#
#    def log(self, msg="", *args, **kwds):
#        pass
#
#    def warn(self, msg, *args, **kwds):
#        pass
#
#    def debug(self, msg, *args, **kwds):
#        pass


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
        self.do_output(instrument_version, output_path, format)

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
              tolerant=True, format='csv'
    ):
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

    def import_assessment(self, base_row, import_data):
        assessment_id = base_row.get('assessment_id')
        if not assessment_id:
            raise Error("Unexpected import data, `assessment_id` not found.")
        self.log("Starting assessment `%(id)s` import..."
                 % {'id': assessment_id}
        )
        assessment_data = self.make_assessment_data(assessment_id,
                                                    import_data
                          )
        assessment_data[self.instrument.id] = base_row
        assessment = Assessment.create(self.instrument,
                                       assessment_data
                                )
        return assessment

    def rollback(self, assessments):
        for assessment in assessments:
            self.warn("Rollback assessment `%(assessment_uid)s`."
                      % {'assessment_uid': assessment.uid})
            assessment.delete()


class AssessmentCSVImporter(AssessmentImporter):

    name = 'csv'

    def __call__(self, input):
        input_files = self.process_input(input)
        self.start_import(input_files)

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
                    filename = filename.rsplit('.', 1)
                    if len(filename) != 2 or filename[1] != 'csv':
                        continue
                    obj_id = filename[0]
                    if obj_id in self.instrument.template:
                        input_files[obj_id] = filepath
        if not input_files:
            raise Error("Not found any csv file appropriate to import.")
        return input_files

    def start_import(self, input_files):
        success_import = True
        imported = []
        if self.instrument.id not in input_files:
            raise Error("Not found %(root_tpl_id)s.csv file sufficient"
                        " to the root template %(root_tpl_id)s."
                        % {'root_tpl_id': self.instrument.id}
            )
        base_path = input_files.pop(self.instrument.id)
        with open(base_path, 'rU') as base_file:
            try:
                reader = csv.DictReader(base_file)
            except Exception, exc:
                raise Error("Unexpected assessment file %(filepath)s."
                            % {'filepath': base_path},
                            exc
                )
            for (idx, row) in enumerate(reader):
                try:
                    assessment = self.import_assessment(row, input_files)
                    imported.append(assessment)
                except Error, exc:
                    msg = "Unable to import `%(idx)s` row" \
                          " of the `%(base_path)s`: %(error)s" \
                          % {'idx': idx, 'base_path': base_path, 'error': exc}
                    if not self.tolerant:
                        raise Error(msg)
                    self.warn(msg)
                except Exception, exc:
                    success_import = False
                    self.warn(str(exc))
                    if not self.tolerant:
                        self.warn("Import failed.")
                        self.rollback(imported)
                        raise Error("Nothing was imported.")
                else:
                    self.log("Import finished, assessment `%(id)s` generated."
                             % {'id': assessment.uid}
                    )

    def make_assessment_data(self, assessment_id, import_files):
        assessment_data = OrderedDict()
        for rec_id, rec_file in import_files.items():
            with open(rec_file, 'rU') as _file:
                try:
                    reader = csv.DictReader(_file)
                except Exception, exc:
                    raise Error("Got unexpected csv file `%(filepath)s`."
                                % {'filepath': rec_file}, exc
                    )
                if 'assessment_id' not in reader.fieldnames:
                    raise Error("Not found `assessment_id` trough"
                        " `%(filepath)s`."
                        % {'filepath': record_list_filepath}
                    )
                record = []
                error_nums = []
                i = 1
                for row in reader:
                    row_assessment_id = row.get('assessment_id')
                    i += 1
                    if not row_assessment_id:
                        error_nums.append(str(i))
                    if row_assessment_id != assessment_id:
                        continue
                    record.append(row)
                assessment_data[rec_id] = record
                if error_nums:
                    self.warn("File `%(filepath)s` contains bad formatted row"
                    " numbers # (`%(error_nums)s`,), `assessment_id` is required."
                    % {'filepath': rec_file,
                       'error_nums': ', '.join(error_nums)
                      }
                    )
        return assessment_data


class AssessmentXLSImporter(AssessmentImporter):
    name = 'xls'

    def __call__(self, input):
        workbook = self.process_input(input)
        self.start_import(workbook)

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

    def start_import(self, workbook):
        success_import = True
        imported = []
        sheet = workbook.sheets()[0]
        if sheet.cell_value(0, 0) != self.instrument.id:
            raise Error("instrument.id is expected as a value of"
                        " sheet[1].cell(0, 0)"
            )
        if sheet.nrows < 3:
            raise Error("Sheet[0] has to keep at least 3 rows;"
                        " where 1st row - a sheet name,"
                        " 2nd - data header,  3rd - data."
            )

        for row_idx in range(2, sheet.nrows):
            row = self.get_row(sheet, row_idx)
            try:
                assessment = self.import_assessment(row, workbook)
                imported.append(assessment)
            except Error, exc:
                msg = "Unable to import `%(idx)s` row" \
                      " of the `%(instrument)s`: %(error)s" \
                      % {'idx': row_idx,
                         'instrument': self.instrument.id,
                         'error': exc
                      }
                if not self.tolerant:
                    raise Error(msg)
                self.warn(msg)
            except Exception, exc:
                success_import = False
                self.warn(str(exc))
                if not self.tolerant:
                    self.warn("Import failed.")
                    self.rollback(imported)
                    raise Error("Nothing was imported.")
            else:
                self.log("Import finished, assessment `%(id)s` generated."
                         % {'id': assessment.uid}
                )

    def make_assessment_data(self, assessment_id, workbook):
        assessment_data = OrderedDict()
        for idx, sheet in enumerate(workbook.sheets()):
            if idx == 0:
                continue
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
            col_idx = header.index('assessment_id')
            for row_idx in range(2, sheet.nrows):
                if sheet.cell_value(row_idx, col_idx) == assessment_id:
                    row = self.get_row(sheet, row_idx)
                    record.append(row)
            assessment_data[record_id] = record
        return assessment_data

    def get_row(self, sheet, row_idx):
        headers = dict( (i, sheet.cell_value(1, i) ) for i in range(sheet.ncols) )
        return dict( (headers[j], sheet.cell_value(row_idx, j)) for j in headers )

    def sheet_header(self, sheet):
        return [ sheet.cell_value(1, i) for i in range(sheet.ncols) ]
