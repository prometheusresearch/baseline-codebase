import os
import csv
import xlwt
import xlrd
import zipfile
import tempfile
import datetime
import shutil
from collections import OrderedDict
from copy import deepcopy

from rex.instrument.util import get_implementation
from rex.core import Error, get_settings

from .interface import *
from .error import AssessmentImportError


__all__ = ('export_template',
           'import_assessment'
)

def export_template(instrument_uid, version=None, output=None, format=None,
                    verbose=False):
    if format and format.lower() not in ('csv', 'xls'):
        raise Error('Format %s is unknown. One of xls, csv is expected'
                    % format)
    if verbose: print('Starting template export...')
    if verbose: print('Looking for instrument version in the data store...')
    instrument_impl = get_implementation('instrument')
    instrument = instrument_impl.get_by_uid(instrument_uid)
    if not instrument:
        raise Error('Instrument "%s" does not exist.' % instrument_uid)
    if not version:
        instrument_version = instrument.latest_version
    else:
        instrument_version = instrument.get_version(version)
    if not instrument_version:
        raise Error('The desired version of "%s" does not exist.'
                    % instrument)
    instrument = Instrument(instrument_version.uid,
                            instrument_version.definition)
    if verbose: print('Generating template for the instrument version %s...'
        % instrument_version.uid)
    template = TemplateCollection(instrument)
    if not output:
        output = '.'
    output = os.path.abspath(output)
    if not os.path.exists(output):
        if verbose: print('Creating output directory %s ...' % output)
        try:
            os.mkdir(output)
        except OSError, exc:
                raise Error('Could not add output directory "%s"' % output, exc)
    elif not os.path.isdir(output):
        raise Error('%s is not a directory' % output)
    if not os.access(output, os.W_OK):
        raise Error('Directory "%s" is forbidden for writing' % output)
    if verbose: print('Saving template in %s format...' % (format or 'CSV'))
    if not format or format.lower() == 'csv':
        save_csv_template(template, output)
    elif format.lower() == 'xls':
        save_xls_template(instrument.id, template, output)


def save_csv_template(template, output):
    for name, data in template:
        path = os.path.join(output, name + '.csv')
        with open(path, 'w') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=data.keys())
            writer.writeheader()
            writer.writerow(data)

def save_xls_template(id, template, output):
    workbook = xlwt.Workbook()
    for idx, (name, data) in enumerate(template):
        sheet = workbook.add_sheet(str(idx))
        sheet.row(0).write(0, name)
        for idx, (key, value) in enumerate(data.items()):
            sheet.row(1).write(idx, key)
            sheet.row(2).write(idx, value)
    workbook.save(os.path.join(output, '%s.xls' % id))


def import_assessment(instrument_uid, version=None, input=None, verbose=False,
                      user=None):
    if verbose: print('Starting assessment import...')
    if not input:
        input = '.'
    input = os.path.abspath(input)
    if not os.path.exists(input):
        raise Error("Input path %s not found." % input)
    if verbose: print('Looking for instrument version in the data store...')
    instrument_impl = get_implementation('instrument')
    instrument = instrument_impl.get_by_uid(instrument_uid)
    if not instrument:
        raise Error('Instrument "%s" does not exist.' % instrument_uid)
    if not version:
        instrument_version = instrument.latest_version
    else:
        instrument_version = instrument.get_version(version)
    if not instrument_version:
        raise Error('The desired version of "%s" does not exist.'
                    % instrument)
    if verbose: print('Generating template for the instrument version %s...'
        % instrument_version.uid)
    instrument = Instrument(instrument_version.uid,
                            instrument_version.definition)
    template = TemplateCollection(instrument)
    if verbose: print("Reading input data...")
    data = OrderedDict()
    if os.path.isdir(input):
        for filename in os.listdir(input):
            filepath = os.path.join(input, filename)
            data = read_csv(filepath, data=data)
    elif zipfile.is_zipfile(input):
        tmpdir = tempfile.mkdtemp()
        with zipfile.ZipFile(input, 'r') as zf:
            zf.extractall(tmpdir)
        for filename in os.listdir(tmpdir):
            filepath = os.path.join(tmpdir, filename)
            data = read_csv(filepath, data=data)
    _, ext = os.path.splitext(input)
    if ext == '.xls':
        data = read_xls(input)
    elif ext == '.csv':
        data = read_csv(input, template_name=instrument.id)
    if not data:
        if verbose: print('No import data found.')
    else:
        if verbose: print('Checking data with instrument template...')
        import_data = collect_assessment_data(data, template)
        bulk_assessments = []
        for assessment_id, data in import_data.items():
            if verbose: print("Generating assessment %s json..." % assessment_id)
            assessment = Assessment(instrument, assessment_id, data)
            try:
                bulk_assessment = assessment.create_bulk_assessment()
                bulk_assessments.append(deepcopy(bulk_assessment))
            except AssessmentImportError, exc:
                save_failed_import(exc.message, input, exc.template_id, user,
                                   assessment_id)
                raise Error("Bad data is given for assessment %s"
                            % assessment_id, exc.message)
            except Exception, exc:
                save_failed_import(exc, input, instrument.id, user,
                                   assessment_id)
                raise Error("Bad data is given for assessment %s"
                            % assessment_id, exc)
        assessment_impl = get_implementation('assessment')
        if verbose: print('Saving assessments...')
        try:
            assessment_impl.bulk_create(bulk_assessments)
        except Exception, exc:
            save_failed_import(exc, input, instrument.id, user)
            raise exc
        if verbose: print('Assessment import finished.')


def read_xls(path):

    def get_row(sheet, row_idx):
        headers = dict((i, sheet.cell_value(1, i)) for i in range(sheet.ncols))
        return dict((headers[j], sheet.cell_value(row_idx, j)) for j in headers)

    try:
        workbook = xlrd.open_workbook(path)
    except xlrd.XLRDError, exc:
        raise Error("Unexpected xls file %s." % path, exc)
    data = OrderedDict()
    for idx, sheet in enumerate(workbook.sheets()):
        if sheet.nrows < 2:
            raise Error("Unexpected xls file %s." % path,
                        "Sheet %s contains less than 2 rows." % idx)
        name = sheet.cell_value(0, 0)
        data[name] = [get_row(sheet, row_idx)
                        for row_idx in range(2, sheet.nrows)]
    return data


def read_csv(path, template_name=None, data=OrderedDict()):
    name, ext = os.path.splitext(os.path.basename(path))
    if ext != '.csv':
        return data
    with open(path, 'rU') as csvfile:
        try:
            reader = csv.DictReader(csvfile)
        except Exception:
            exc = traceback.format_exc()
            raise Error("Unexpected csv file %s" % path, ext)
        data[template_name or name] = [row for row in reader]
    return data


def save_failed_import(exc, input, template_id, user=None, assessment_id=None):

    def find_file(input, template_id):
        for filename in os.listdir(input):
            name, ext = os.path.splitext(filename)
            if name == template_id and ext in ('.csv', '.xls'):
                return os.path.join(input, filename)
        return None

    output = get_settings().assessment_import_dir
    if not output: return
    output = os.path.abspath(output)
    user = user or 'unknown'
    logfilepath = os.path.join(output, 'import.log')
    when = unicode(datetime.datetime.now())
    with open(logfilepath, 'a') as logfile:
        logfile.write('\n%s\n' % '\t'.join([when, user, template_id]))
        if assessment_id:
            logfile.write('assessment_id=%s\n' % assessment_id)
        logfile.write(str(exc) + '\n')
    output = os.path.join(output, user)
    if not os.path.exists(output):
        os.mkdir(output)
    if zipfile.is_zipfile(input):
        tmpdir = tempfile.mkdtemp()
        with zipfile.ZipFile(input, 'r') as zf:
            zf.extractall(tmpdir)
            filepath = find_file(tmpdir, template_id)
    elif os.path.isfile(input):
        filepath = input
    elif os.path.isdir(input):
        filepath = find_file(input, template_id)
    if not filepath: return
    output = os.path.join(output, when + '-' + os.path.basename(filepath))
    shutil.copyfile(filepath, output)
    with open(logfilepath, 'a') as logfile:
        logfile.write('Invalid input file saved in: %s\n' % output)


