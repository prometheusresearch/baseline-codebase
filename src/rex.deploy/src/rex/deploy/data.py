#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, guard, StrVal, BoolVal
from .fact import Fact, LabelVal
from .sql import mangle, sql_select, sql_insert, sql_update
import os.path
import csv
import re
import htsql.core.domain
import htsql.core.util


class _skip_type(object):
    def __repr__(self):
        return "SKIP"
SKIP = _skip_type()


class DataFact(Fact):

    fields = [
            ('data', StrVal()),
            ('of', LabelVal(), None),
            ('present', BoolVal(), True),
    ]

    @classmethod
    def build(cls, driver, spec):
        table_label = spec.of
        data_path = None
        data = None
        if not re.match(r'\A\S+\Z', spec.data):
            data = spec.data
        else:
            data_path = spec.data
            if driver.cwd is not None:
                data_path = os.path.join(driver.cwd, data_path)
            if table_label is None:
                basename = os.path.splitext(os.path.basename(data_path))[0]
                table_label = basename.decode('utf-8')
        if table_label is None:
            raise Error("Got missing table name")
        is_present = spec.present
        return cls(table_label, data_path=data_path, data=data,
                   is_present=is_present)

    def __init__(self, table_label, data_path=None, data=None, is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert (data_path is None or
                (isinstance(data_path, str) and len(data_path) > 0))
        assert data is None or isinstance(data, str)
        assert (data_path is None) != (data is None)
        assert isinstance(is_present, bool)
        self.table_label = table_label
        self.data_path = data_path
        self.data = data
        self.is_present = is_present
        #: Table SQL name.
        self.table_name = mangle(table_label)

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        if self.data_path is not None:
            args.append("data_path=%r" % self.data_path)
        if self.data is not None:
            args.append("data=%r" % self.data)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            return self.create(driver)
        else:
            return self.drop(driver)

    def create(self, driver):
        # Ensures that the table contains the given data.

        # Find the table.
        schema = driver.get_schema()
        if self.table_name not in schema:
            raise Error("Detected missing table:", self.table_name)
        table = schema[self.table_name]
        if table.primary_key is None:
            raise Error("Detected table without PRIMARY KEY constraint:", table)

        # Load input data.
        rows = self._parse(driver, table)
        # If no input, assume NOOP.
        if not rows:
            return

        # Load existing table content.
        self._preload(driver, table)

        # Indexes of the primary key columns.
        key_mask = [table.columns.index(column.name)
                    for column in table.primary_key]
        # Indexes of columns that do not belong to the PK.
        nonkey_mask = [table.columns.index(column.name)
                       for column in table
                       if column not in table.primary_key]

        # Target table for a link column.
        targets = {}
        for column in table:
            foreign_keys = column.foreign_keys
            if foreign_keys:
                targets[column] = foreign_keys[0].target

        for row_idx, row in enumerate(rows):
            try:
                # Verify that PK is provided.
                for idx in key_mask:
                    if row[idx] is None or row[idx] is SKIP:
                        raise Error("Detected column with missing value:",
                                    table[idx])
                # Convert links to FK values.
                if targets:
                    items = []
                    for column, data in zip(table, row):
                        item = data
                        if (column in targets and
                                data is not None and data is not SKIP):
                            target = targets[column]
                            item = self._resolve(driver, target, data)
                            if item is None:
                                dumper = self._domain(column).dump
                                raise Error("Detected unknown link:",
                                            dumper(data))
                        items.append(item)
                    row = tuple(items)
                # The primary key value.
                handle = tuple(row[idx] for idx in key_mask)
                # Find an existing row by the PK.
                old_row = table.data.get(table.primary_key, handle)
                if old_row is not None:
                    # Find columns and values that changed.
                    names = []
                    values = []
                    for column, data, old_data in zip(table, row, old_row):
                        if data is SKIP or data == old_data:
                            continue
                        names.append(column.name)
                        values.append(data)
                    if not names:
                        continue
                    # Update an existing row.
                    if driver.is_locked:
                        raise Error("Detected modified row")
                    key_names = [column.name
                                 for column in table.primary_key]
                    returning_names = [column.name for column in table]
                    output = driver.submit(sql_update(
                            table.name, key_names, handle, names, values,
                            returning_names))
                    assert len(output) == 1
                    table.data.update(old_row, output[0])
                else:
                    # Add a new row.
                    if driver.is_locked:
                        raise Error("Detected missing row")
                    names = []
                    values = []
                    for column, data in zip(table, row):
                        if data is SKIP:
                            continue
                        names.append(column.name)
                        values.append(data)
                    returning_names = [column.name for column in table]
                    output = driver.submit(sql_insert(
                            table.name, names, values, returning_names))
                    assert len(output) == 1
                    table.data.insert(output[0])
            except Error, error:
                # Add the row being processed to the error trace.
                items = []
                for column, data in zip(table, rows[row_idx]):
                    if data is None or data is SKIP:
                        continue
                    dumper = self._domain(column).dump
                    item = htsql.core.util.to_literal(dumper(data))
                    items.append(item)
                error.wrap("While processing row #%s:" % (row_idx+1),
                           u"{%s}" % u", ".join(items))
                raise

    def _parse(self, driver, table):
        # Loads and parses CSV input.
        if self.data_path is not None:
            reader = csv.reader(open(self.data_path))
        else:
            reader = csv.reader(self.data.splitlines())
        try:
            labels = next(reader)
        except StopIteration:
            # Empty CSV file, assume NOOP.
            return []
        slices = list(reader)

        # Maps a table column to a position in the slice.
        masks = {}
        # Maps a table column to a converter to native representation.
        parsers = {}
        # Find table columns provided by the input CSV.
        for idx, label in enumerate(labels):
            column_name = mangle(label)
            link_name = mangle(label, u'id')
            if column_name in table:
                column = table[column_name]
            elif link_name in table:
                column = table[link_name]
            else:
                raise Error("Detected missing column:",
                            "%s.%s" % (table, column_name))
            if column in masks:
                raise Error("Detected duplicate column:",
                            "%s.%s" % (table, column_name))
            masks[column] = idx
            parsers[column] = self._domain(column).parse

        # Verify that we got PK columns.
        for column in table.primary_key:
            if column not in masks:
                raise Error("Detected missing PRIMARY KEY column:", column)

        # Convert text slices into native form.
        rows = []
        for idx, slice in enumerate(slices):
            if self.data_path is not None:
                location = "\"%s\", row %s" % (self.data_path, idx+2)
            else:
                location = "row %s" % (idx+2)
            with guard("On:", location):
                if len(slice) < len(masks):
                    raise Error("Detected too few entries:",
                                "%s < %s" % (len(slice), len(masks)))
                elif len(slice) > len(masks):
                    raise Error("Detected too many entries:",
                                "%s > %s" % (len(slice), len(masks)))
                # Convert the row.
                row = []
                for column in table.columns:
                    if column not in masks:
                        data = SKIP
                    else:
                        text = slice[masks[column]]
                        if not text:
                            data = SKIP
                        else:
                            parser = parsers[column]
                            try:
                                data = parser(text.decode('utf-8'))
                            except ValueError, exc:
                                error = Error("Detected invalid input:", exc)
                                error.wrap("While converting column:", column)
                                raise error
                    row.append(data)
                rows.append(tuple(row))

        return rows

    def _domain(self, column):
        # Determines HTSQL domain of the column.

        # FK column -> identity of the target table.
        if column.foreign_keys:
            target = column.foreign_keys[0].target
            labels = [self._domain(column)
                      for column in target.primary_key]
            return htsql.core.domain.IdentityDomain(labels)
        # Type image.
        type = column.type
        # Unwrap a domain type.
        while type.is_domain:
            type = type.base_type
        # Translate a `ENUM` type.
        if type.is_enum:
            labels = [label.decode('utf-8') for label in type.labels]
            return htsql.core.domain.EnumDomain(labels)
        # Translate known scalar types.
        elif type.schema.name == 'pg_catalog':
            if type.name == 'bool':
                return htsql.core.domain.BooleanDomain()
            elif type.name in ['int2', 'int4', 'int8']:
                return htsql.core.domain.IntegerDomain()
            elif type.name in ['float4', 'float8']:
                return htsql.core.domain.FloatDomain()
            elif type.name == 'numeric':
                return htsql.core.domain.DecimalDomain()
            elif type.name in ['bpchar', 'varchar', 'text']:
                return htsql.core.domain.TextDomain()
            elif type.name == 'date':
                return htsql.core.domain.DateDomain()
            elif type.name in ['time', 'timetz']:
                return htsql.core.domain.TimeDomain()
            elif type.name in ['timestamp', 'timestamptz']:
                return htsql.core.domain.DateTimeDomain()
        # Fallback domain.
        return htsql.core.domain.OpaqueDomain()

    def _resolve(self, driver, table, identity):
        # Finds a row by identity.

        # Pre-load table data if necessary.
        self._preload(driver, table)

        # Determine the PK value.
        handle = []
        for item, column in zip(identity, table.primary_key):
            if not column.foreign_keys:
                handle.append(item)
            else:
                target = column.foreign_keys[0].target
                item = self._resolve(driver, target, item)
                handle.append(item)
        handle = tuple(handle)
        # Find the row by PK.
        row = table.data.get(table.primary_key, handle)
        # Return the row ID.
        if row is None:
            return None
        else:
            return row[0]

    def _preload(self, driver, table):
        # Pre-loads table data if necessary.
        if table.data is None:
            data = driver.submit(sql_select(
                    table.name, [column.name for column in table]))
            table.add_data(data)

    def drop(self, driver):
        raise NotImplementedError("%s.drop()" % self.__class__.__name__)


