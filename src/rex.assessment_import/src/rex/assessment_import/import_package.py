import os
import csv
import xlrd
import xlwt
import zipfile
import datetime
import shutil

from StringIO import StringIO
from collections import OrderedDict

from rex.core import get_settings, Error


__all__ = (
    'ImportPackage',
)

class ImportChunk(object):

    def __init__(self, id, data, user=None):
        for row in data:
            assert isinstance(row, dict)
        self.id = id
        self.data = data
        self.user = user or 'unknown'

    def fail(self, msg):
        output = get_settings().assessment_import_dir
        if not output:
            return
        logfile = os.path.join(output, 'import.log')
        output = os.path.join(output, self.user)
        if not os.path.exists(output):
            os.mkdir(output)
        when = str(datetime.datetime.now())
        output = os.path.join(output, when + '-' + self.id + '.csv')
        with open(output, 'w') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=self.data[0].keys())
            writer.writeheader()
            for row in self.data:
                writer.writerow(row)
        with open(logfile, 'a') as f:
            f.write('\t'.join([when, self.user]))
            f.write('\n' + str(msg) + '\n')
            f.write('File saved as `%s`.\n\n' % output)


class ImportPackage(object):

    @classmethod
    def fail(cls, msg, input, user=None):
        user = user or 'unknown'
        output = get_settings().assessment_import_dir
        if output:
            when = str(datetime.datetime.now())
            logfile = os.path.join(output, 'import.log')
            with open(logfile, 'a') as f:
                f.write('\t'.join([when, user]))
                f.write('\n' + str(msg) + '\n')
            output = os.path.join(output, user)
            if not os.path.exists(output):
                os.mkdir(output)
            if os.path.isdir(input):
                output = os.path.join(output,
                                      when + '-' + os.path.basename(input))
                os.mkdir(output)
                for filename in os.listdir(input):
                    input_filename = os.path.join(input, filename)
                    output_filename = os.path.join(output, filename)
                    shutil.copy(input_filename, output_filename)
                    with open(logfile, 'a') as f:
                        f.write('File saved as `%s`.\n\n' % output_filename)
            else:
                filename = os.path.basename(input)
                filename = when + '-' + filename
                output = os.path.join(output, filename)
                shutil.copy(input, output)
                with open(logfile, 'a') as f:
                    f.write('File saved as `%s`.\n\n' % output)
        raise Error(str(msg))

    @classmethod
    def from_xls(cls, path, user=None):
        # read of all tabs in the XLS file and transform to list of chunks

        def get_row(sheet, row_idx):
            headers = dict((i, sheet.cell_value(1, i))
                                for i in range(sheet.ncols))
            return dict((headers[j], sheet.cell_value(row_idx, j))
                            for j in headers)

        assert os.path.isfile(path)
        filename = os.path.basename(path)
        (name, ext) = os.path.splitext(filename)
        assert ext == '.xls'

        chunks = []
        try:
            workbook = xlrd.open_workbook(path)
        except xlrd.XLRDError, exc:
            exc = Error("Bad xls file", exc)
            cls.fail(exc, path, user)
        data = OrderedDict()
        for idx, sheet in enumerate(workbook.sheets()):
            if sheet.nrows < 2:
                exc = Error("Unexpected xls file %s." % path,
                            "Sheet %s contains less than 2 rows." % idx)
                cls.fail(exc, path, user)
            name = sheet.cell_value(0, 0)
            data =  [get_row(sheet, row_idx)
                        for row_idx in range(2, sheet.nrows)]
            chunk = ImportChunk(name, data, user)
            chunks.append(chunk)
        return cls(chunks)

    @classmethod
    def from_directory(cls, path, user=None):
        assert os.path.isdir(path)
        # os.listdir, all csv files become chunks
        path = os.path.abspath(path)
        chunks = []
        for filename in os.listdir(path):
            (name, ext) = os.path.splitext(filename)
            if ext != '.csv': continue
            filepath = os.path.join(path, filename)
            with open(filepath, 'rU') as csvfile:
                try:
                    data = cls.read_csv(csvfile, user)
                except Exception, exc:
                    exc = Error("Unable to read csv %s" % filepath, exc)
                    cls.fail(exc, path, user)
                chunks.append(ImportChunk(name, data, user))
        return cls(chunks=chunks)

    @classmethod
    def read_csv(cls, csvfile, user=None):
        reader = csv.DictReader(csvfile)
        data = [row for row in reader]
        return data

    @classmethod
    def from_zip(cls, path, user=None):
        assert zipfile.is_zipfile(path)
        chunks = []
        with zipfile.ZipFile(path, 'r') as zf:
            for filepath in zf.namelist():
                head, filename = os.path.split(filepath)
                if not filename: continue
                name, ext = os.path.splitext(os.path.basename(filepath))
                if name.startswith('.'): continue
                if ext != '.csv': continue
                with zf.open(filepath, 'rU') as csvfile:
                    try:
                        data = cls.read_csv(csvfile, user)
                    except Exception, exc:
                        exc = Error("Unable to read csv %s" % filepath, exc)
                        cls.fail(exc, path, user)
                    chunks.append(ImportChunk(name, data, user))
        if not chunks:
            exc = Error("No data to import.")
            cls.fail(exc, path, user)
        return cls(chunks=chunks)

    @classmethod
    def from_csv(cls, path, user=None):
        assert os.path.isfile(path)
        chunks = []
        filename = os.path.basename(path)
        (name, ext) = os.path.splitext(filename)
        assert ext == '.csv'
        with open(path, 'rU') as csvfile:
            try:
                data = cls.read_csv(csvfile, user)
            except Exception, exc:
                exc = Error("Unable to read csv %s." % path, exc)
                cls.fail(exc, path, user)
            chunks.append(ImportChunk(name, data, user))
        return cls(chunks=chunks)

    def __init__(self, chunks=[], user=None):
        for f in chunks:
            assert isinstance(f, ImportChunk)
        self.chunks = chunks

    def __iter__(self):
        return iter(self.chunks)

    def as_csv_file(self):
        if len(self.chunks) > 1:
            raise Error("Unable to generate csv file for more than one chunk")
        csvcontent = StringIO()
        writer = csv.DictWriter(csvcontent,
                                fieldnames=self.chunks[0].data[0].keys())
        writer.writeheader()
        for row in self.chunks[0].data:
            writer.writerow(row)
        csvfilename = self.chunks[0].id + '.csv'
        return (csvfilename, csvcontent.getvalue())

    def as_zip_file(self):
        zipcontent = StringIO()
        zipname = min([chunk.id for chunk in self.chunks]) + '.zip'
        with zipfile.ZipFile(zipcontent, 'w') as _zip:
            for chunk in self.chunks:
                csvcontent = StringIO()
                writer = csv.DictWriter(csvcontent,
                                        fieldnames=chunk.data[0].keys())
                writer.writeheader()
                for row in chunk.data:
                    writer.writerow(row)
                _zip.writestr(chunk.id + '.csv', csvcontent.getvalue())
        return (zipname, zipcontent.getvalue())

    def as_xls_file(self):
        workbook = xlwt.Workbook()
        for chunk_idx, chunk in enumerate(self.chunks):
            sheet = workbook.add_sheet(str(chunk_idx))
            sheet.write(0, 0, chunk.id)
            header = []
            if chunk.data: header = chunk.data[0].keys()
            for col_idx, key in enumerate(header):
                sheet.write(1, col_idx, key)
                for row_idx, row in enumerate(chunk.data):
                    sheet.write(row_idx+2, col_idx, row.get(key))
        filename = min([chunk.id for chunk in self.chunks]) + '.xls'
        s = StringIO()
        workbook.save(s)
        return (filename, s.getvalue())

