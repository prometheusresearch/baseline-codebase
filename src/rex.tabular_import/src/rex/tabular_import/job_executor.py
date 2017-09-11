
#
# Copyright (c) 2017, Prometheus Research, LLC
#

import os.path
import sys
import traceback

from rex.core import Error
from rex.db import get_db, Query
from rex.attach import get_storage
from rex.deploy import model
from rex.job import JobExecutor
from .introspect import get_table_description
from .load import import_tabular_data
from .marshal import FILE_FORMATS, FILE_FORMAT_XLS
from .error import TabularImportError

START = """
    job_tabular_import[$id]{table, file := string(file.id())}
"""

COMPLETE = """\
update(job_tabular_import[$id]{id(),
    result := $result,
})
"""

class TabularImportJobExecutor(JobExecutor):
    name = 'tabular_import'

    def execute(self, id, owner, payload):
        db = get_db()
        with db, db.transaction():
            product = Query(START).produce(id=id)
        try:
            self.check_table(product.data.table)
            content, format = self.get_file_data(product.data.file)
            with db, db.transaction():
                num_imported = import_tabular_data(
                    product.data.table,
                    content,
                    format
                )
                Query(COMPLETE).produce(
                    id=id,
                    result="Successfully imported %s row(s)" % num_imported
                )
        except Exception as e:
            result = unicode(e) if isinstance(e, (Error, TabularImportError)) \
                     else traceback.format_exc()
            raise Error(result)

    def get_file_data(self, file_handler):
        storage = get_storage()
        path = storage.abspath(file_handler[1:-1])
        _, ext = os.path.splitext(path)
        format = ext[1:].upper()
        if format not in FILE_FORMATS:
            raise Error("Unsupported file format: %s" % format)
        flags = 'rb' if format == FILE_FORMAT_XLS else 'rU'
        return open(path, flags).read(), format

    def check_table(self, table_name):
        with get_db():
            schema = model()
            table = schema.table(table_name)
            if table is None:
                raise Error("Table does not exist: %s" % table_name)

