#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Error, guard, StrVal, BoolVal, OneOrSeqVal, MapVal,
        UnionVal, OnScalar)
from .fact import Fact, LabelVal
from .sql import mangle, sql_select, sql_insert, sql_update
import os.path
import csv
import re
import json
import decimal
import datetime
import htsql.core.domain
import htsql.core.util
import psycopg2.tz


class _skip_type(object):
    # Set a `repr()` value for `sphinx.ext.autodoc`.
    def __repr__(self):
        return "SKIP"
#: Special value which indicates that the column or the link should be ignored.
SKIP = _skip_type()


class DataVal(MapVal):
    # Like `MapVal`, but also accept `namedtuple` objects.

    def __call__(self, data):
        if hasattr(data, '_fields') or hasattr(data, '__fields__'):
            return data
        return super(DataVal, self).__call__(data)


class DataFact(Fact):
    """
    Describes table content.

    `table_label`: ``unicode``
        The name of the table.
    `data_path`: ``str`` or ``None``
        Path to a file with table data.  File must be in CSV, JSON or YAML
        format (determined from the file extension).
    `data`: ``str``, record, list of records or ``None``
        Table data.  Either ``data_path`` or ``data`` must be specified,
        but not both.  If ``data`` is a string, it must be in CSV format.
        Otherwise, it's a record or a list of record.  A record could be
        represented as a ``dict`` or as a ``namedtuple``-like object.
    `is_present`: ``bool``
        Indicates whether or not the table contains the given data.
    """

    data_validate = OneOrSeqVal(DataVal(LabelVal))

    fields = [
            ('data', UnionVal((OnScalar, StrVal), data_validate)),
            ('of', LabelVal, None),
            ('present', BoolVal, True),
    ]

    @classmethod
    def build(cls, driver, spec):
        table_label = spec.of
        data_path = None
        data = None
        if isinstance(spec.data, str) and re.match(r'\A\S+\Z', spec.data):
            data_path = spec.data
            if driver.cwd is not None:
                data_path = os.path.join(driver.cwd, data_path)
            if table_label is None:
                basename = os.path.splitext(os.path.basename(data_path))[0]
                table_label = basename.decode('utf-8')
        else:
            data = spec.data
        if table_label is None:
            raise Error("Got missing table name")
        is_present = spec.present
        return cls(table_label, data_path=data_path, data=data,
                   is_present=is_present)

    def __init__(self, table_label, data_path=None, data=None, is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert (data_path is None or
                (isinstance(data_path, str) and len(data_path) > 0))
        assert (data is None or
                isinstance(data, str) or
                isinstance(data, dict) or
                hasattr(data, '_fields') or
                hasattr(data, '__fields__') or
                (isinstance(data, list) and
                    all(isinstance(item, dict) or
                        hasattr(item, '_fields') or
                        hasattr(item, '__fields__')
                        for item in data)))
        assert (data_path is None) != (data is None)
        assert isinstance(is_present, bool)
        self.table_label = table_label
        self.data_path = data_path
        self.data = data
        self.is_present = is_present
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
        rows = self._load(table)
        # If no input, assume NOOP.
        if not rows:
            return

        # Load existing table content.
        self._fetch(driver, table)

        # Indexes of the primary key columns.
        column_names = table.columns.keys()
        key_mask = [column_names.index(column.name)
                    for column in table.primary_key]
        # Indexes of columns that do not belong to the PK.
        nonkey_mask = [column_names.index(column.name)
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
                                    table.columns.keys()[idx])
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
                    returning_names = [column.name for column in table]
                    output = driver.submit(sql_update(
                            table.name, u'id', old_row[0], names, values,
                            returning_names))
                    assert len(output) == 1
                    table.data.update(old_row, output[0])
                else:
                    # Add a new row.
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
                    if data is SKIP:
                        continue
                    if data is None:
                        item = u'null'
                    else:
                        dumper = self._domain(column).dump
                        item = htsql.core.util.to_literal(dumper(data))
                    items.append(item)
                error.wrap("While processing row #%s:" % (row_idx+1),
                           u"{%s}" % u", ".join(items))
                raise

    def _load(self, table):
        # Loads input data and produces a list of tuples.

        # Detect data source and format.
        data = self.data
        if self.data_path is not None:
            extension = os.path.splitext(self.data_path)[1]
            if extension == '.csv':
                data = open(self.data_path)
            elif extension == '.json':
                stream = open(self.data_path)
                with guard("While parsing JSON data:", self.data_path):
                    try:
                        data = json.load(stream)
                    except ValueError, exc:
                        raise Error("Detected ill-formed JSON:", exc)
                    data = self.data_validate(data)
            elif extension == '.yaml':
                stream = open(self.data_path)
                with guard("While parsing YAML data:", self.data_path):
                    data = self.data_validate.parse(stream)
            else:
                raise Error("Detected unknown data file format:",
                            self.data_path)

        rows = []
        # Process tabular input (CSV).
        if isinstance(data, str) or hasattr(data, 'read'):

            # Read the header and the content of the table.
            if isinstance(data, str):
                data = data.splitlines()
                reader = csv.reader(data)
            else:
                reader = csv.reader(data)
            try:
                labels = next(reader)
            except StopIteration:
                # Empty CSV file, assume NOOP.
                return []
            # Skip empty values.
            slices = [tuple(item if item else SKIP for item in slice)
                      for slice in reader]
            # Convert a slice into a table row.
            try:
                for row in self._convert(table, labels, slices):
                    rows.append(row)
            except Error, error:
                idx = len(rows)+1
                if self.data_path is not None:
                    location = "\"%s\", line #%s" % (self.data_path, idx+1)
                else:
                    location = data[idx]
                error.wrap("While parsing row #%s:" % idx, location)
                raise

        # Process structured input (YAML, JSON, or a list of records).
        else:
            # Treat a record as a one-record list.
            if not isinstance(data, list):
                data = [data]

            for record in data:
                if hasattr(record, '_fields') or hasattr(record, '__fields__'):
                    # Unpack a `namedtuple`-like object.
                    fields = (getattr(record, '_fields', ()) or
                              getattr(record, '__fields__', ()))
                    items = [(field, value)
                             for field, value in zip(fields, record)
                             if field is not None]
                else:
                    # Unpack a dictionary.
                    items = sorted(record.items())
                # Convert a record into a table row.
                labels, slice = zip(*items)
                try:
                    rows.extend(self._convert(table, labels, [slice]))
                except Error, error:
                    if self.data_path is not None:
                        location = "\"%s\"" % self.data_path
                    else:
                        location = record
                    error.wrap("While parsing row #%s:"
                               % (len(rows)+1), location)
                    raise

        return rows

    def _convert(self, table, labels, slices):
        # Converts raw input into a list of table rows.

        # We don't want any errors on empty input.
        if not slices:
            return
        # Maps a table column to a position in the slice.
        masks = {}
        # Maps a table column to its HTSQL domain.
        domains = {}
        # Find table columns corresponding to the input labels.
        for idx, label in enumerate(labels):
            column_name = mangle(label)
            link_name = mangle(label, u'id')
            if column_name in table:
                column = table[column_name]
            elif link_name in table:
                column = table[link_name]
            else:
                raise Error("Detected missing column:", column_name)
            if column in masks:
                raise Error("Detected duplicate column:", column_name)
            masks[column] = idx
            domains[column] = self._domain(column)

        # Verify that we got PK columns.
        for column in table.primary_key:
            if column not in masks:
                raise Error("Detected missing PRIMARY KEY column:", column)

        # Convert raw slices into native form.
        for slice in slices:
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
                    data = slice[masks[column]]
                    if data is not None and data is not SKIP:
                        domain = domains[column]
                        try:
                            # If it's a text value, let the domain parse it.
                            if isinstance(data, str):
                                data = data.decode('utf-8')
                            if isinstance(data, unicode):
                                data = domain.parse(data)
                            # Otherwise, verify that the value is compatible
                            # with the domain.
                            else:
                                data = self._adapt(data, domain)
                        except ValueError, exc:
                            error = Error("Detected invalid input:", exc)
                            error.wrap("While converting column:", column)
                            raise error
                        # If the value is a TZ-aware datetime, we convert
                        # it to the local timezone and then strip the
                        # timezone.  This is compatible with PostgreSQL
                        # TIMESTAMP parsing rules and allows us to compare
                        # datetime values in Python code.
                        if (isinstance(data, datetime.datetime) and
                            data.tzinfo is not None):
                            tz = psycopg2.tz.LocalTimezone()
                            data = data.astimezone(tz).replace(tzinfo=None)
                row.append(data)
            yield tuple(row)

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
        # Fallback to opaque domain.
        return htsql.core.domain.OpaqueDomain()

    @classmethod
    def _adapt(cls, data, domain):
        # Adapts a raw value to the given HTSQL domain.
        if data is None:
            return None
        if isinstance(data, str):
            data = data.decode('utf-8')
        if isinstance(data, unicode):
            return domain.parse(data)
        if isinstance(domain, htsql.core.domain.BooleanDomain):
            if isinstance(data, bool):
                return data
        elif isinstance(domain, htsql.core.domain.IntegerDomain):
            if isinstance(data, (int, long)):
                return data
        elif isinstance(domain, htsql.core.domain.FloatDomain):
            if isinstance(data, float):
                return data
            elif isinstance(data, (int, long, decimal.Decimal)):
                return float(data)
        elif isinstance(domain, htsql.core.domain.DecimalDomain):
            if isinstance(data, decimal.Decimal):
                return data
            if isinstance(data, (int, long, float)):
                return decimal.Decimal(data)
        elif isinstance(domain, htsql.core.domain.DateDomain):
            if isinstance(data, datetime.date):
                return data
        elif isinstance(domain, htsql.core.domain.TimeDomain):
            if isinstance(data, datetime.time):
                return data
        elif isinstance(domain, htsql.core.domain.DateTimeDomain):
            if isinstance(data, datetime.datetime):
                return data
        elif isinstance(domain, htsql.core.domain.IdentityDomain):
            if (isinstance(data, (list, tuple)) and
                    len(data) == len(domain.labels) and
                    None not in data):
                return tuple(cls._adapt(item, label)
                             for item, label in zip(data, domain.labels))
        raise ValueError(repr(data))

    def _resolve(self, driver, table, identity):
        # Finds a row by identity.

        # Pre-load table data if necessary.
        self._fetch(driver, table)

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

    def _fetch(self, driver, table):
        # Pre-loads table data if necessary.
        if table.data is None:
            was_locked = driver.set_lock(False)
            data = driver.submit(sql_select(
                    table.name, [column.name for column in table]))
            table.add_data(data)
            driver.set_lock(was_locked)

    def drop(self, driver):
        raise NotImplementedError("%s.drop()" % self.__class__.__name__)


