#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Error, guard, StrVal, BoolVal, OneOrSeqVal, MapVal,
        UnionVal, OnScalar)
from .fact import Fact, LabelVal
from .model import model
import os.path
import csv
import re
import json
import decimal
import datetime
import htsql.core.domain
import htsql.core.util
import htsql_rex_deploy
import psycopg2.tz
import json
import collections


class _skip_type:
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
                table_label = basename
        else:
            data = spec.data
        if table_label is None:
            raise Error("Got missing table name")
        is_present = spec.present
        return cls(table_label, data_path=data_path, data=data,
                   is_present=is_present)

    def __init__(self, table_label, data_path=None, data=None, is_present=True):
        assert isinstance(table_label, str) and len(table_label) > 0
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

    def to_yaml(self, full=True):
        mapping = collections.OrderedDict()
        mapping['data'] = self.data if self.data is not None else self.data_path
        if full:
            mapping['of'] = self.table_label
        if self.is_present is False:
            mapping['present'] = False
        return mapping

    def __call__(self, driver):
        # Ensures that the table contains the given data.

        # Find the table.
        schema = model(driver)
        table = schema.table(self.table_label)
        if not table:
            raise Error("Discovered missing table:", self.table_label)
        if not table.identity():
            raise Error("Discovered table without identity:", self.table_label)
        fields = table.fields()
        image = table.image

        # Load input data.
        records = self._load(table)
        # If no input, assume NOOP.
        if not records:
            return

        # Load table content.
        self._fetch(table)

        # Do we need to drop table content afterwards?
        is_invalid = False

        # Column indexes.
        indexes = dict((field.image, idx)
                       for idx, field in enumerate(fields))
        key_mask = [column_image.position
                    for column_image in image.primary_key]

        for record_idx, record in enumerate(records):
            try:
                # Convert field values to raw column values.
                row = []
                for column_image in image.columns:
                    index = indexes.get(column_image)
                    if index is not None:
                        data = record[index]
                        field = fields[index]
                        # Resolve links.
                        if field.is_link and \
                                data is not None and data is not SKIP:
                            target = field.target_table
                            data_id = self._resolve(target, data)
                            if data_id is None:
                                target = field.target_table
                                domain = self._domain(field)
                                raise Error("Discovered missing record:",
                                            "%s[%s]" % (target.label,
                                                        domain.dump(data)))
                            data = data_id
                    else:
                        data = SKIP
                    row.append(data)
                row = tuple(row)
                # The primary key value.
                handle = tuple([row[idx] for idx in key_mask])
                # Find an existing row by the PK.
                old_row = image.data.get(image.primary_key, handle)
                if self.is_present:
                    if old_row is not None:
                        # Find columns and values that changed.
                        columns = []
                        values = []
                        for column, data, old_data in zip(image, row, old_row):
                            if data is SKIP or data == old_data:
                                continue
                            columns.append(column)
                            values.append(data)
                        if not columns:
                            continue
                        # Update an existing row.
                        image.data.update(old_row, columns, values)
                    else:
                        # Add a new row.
                        columns = []
                        values = []
                        for column, data in zip(image, row):
                            if data is SKIP:
                                continue
                            columns.append(column)
                            values.append(data)
                        image.data.insert(columns, values)
                else:
                    if old_row is not None:
                        # Remove the row.
                        image.data.delete(old_row)
                        # Data might be invalid.
                        is_invalid = True
            except Error as error:
                # Add the row being processed to the error trace.
                items = []
                for field, data in zip(fields, record):
                    if data is SKIP:
                        continue
                    if data is None:
                        item = 'null'
                    else:
                        dumper = self._domain(field).dump
                        item = htsql.core.util.to_literal(dumper(data))
                    items.append(item)
                error.wrap("While processing row #%s:" % (record_idx+1),
                           "{%s}" % ", ".join(items))
                raise

        # Invalidate cached data.
        if is_invalid:
            for dependent in table.dependents():
                if dependent.is_link and dependent.target_table is table:
                    self._invalidate(dependent.table)

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
                    except ValueError as exc:
                        raise Error("Discovered ill-formed JSON:", exc) from None
                    data = self.data_validate(data)
            elif extension == '.yaml':
                stream = open(self.data_path)
                with guard("While parsing YAML data:", self.data_path):
                    data = self.data_validate.parse(stream)
            else:
                raise Error("Failed to recognize file format:",
                            self.data_path)

        records = []
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
                for record in self._convert(table, labels, slices):
                    records.append(record)
            except Error as error:
                idx = len(records)+1
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
                labels, slice = list(zip(*items))
                try:
                    records.extend(self._convert(table, labels, [slice]))
                except Error as error:
                    if self.data_path is not None:
                        location = "\"%s\"" % self.data_path
                    else:
                        location = record
                    error.wrap("While parsing row #%s:"
                               % (len(records)+1), location)
                    raise

        return records

    def _convert(self, table, labels, slices):
        # Converts raw input into a list of table rows.

        # We don't want any errors on empty input.
        if not slices:
            return
        # Table fields.
        fields = table.fields()
        field_by_label = dict((field.label, field) for field in fields)
        # Table identity.
        identity = table.identity()
        # Maps a table field to a position in the slice.
        masks = {}
        # Maps a table field to its HTSQL domain.
        domains = {}
        # Find table columns corresponding to the input labels.
        for idx, label in enumerate(labels):
            field = field_by_label.get(label)
            if not field:
                raise Error("Discovered missing field:", label)
            if field in masks:
                raise Error("Discovered duplicate field:", label)
            # Forbid non-identity fields when removing rows.
            if not self.is_present and field not in identity.fields:
                raise Error("Discovered unexpected field:", label)
            masks[field] = idx
            domains[field] = self._domain(field)

        # Mandatory PK columns.
        required = set(identity.fields)

        # Convert raw slices into native form.
        for slice in slices:
            if len(slice) < len(masks):
                raise Error("Discovered too few entries:",
                            "%s < %s" % (len(slice), len(masks)))
            elif len(slice) > len(masks):
                raise Error("Discovered too many entries:",
                            "%s > %s" % (len(slice), len(masks)))
            # Prepare the record.
            record = []
            for field in fields:
                if field not in masks:
                    data = SKIP
                else:
                    data = slice[masks[field]]
                    if data is not None and data is not SKIP:
                        domain = domains[field]
                        try:
                            # If it's a text value, let the domain parse it.
                            if isinstance(data, str):
                                data = domain.parse(data)
                            # Otherwise, verify that the value is compatible
                            # with the domain.
                            else:
                                data = self._adapt(data, domain)
                        except ValueError as exc:
                            error = Error("Discovered invalid input:", exc)
                            error.wrap("While converting field:", field.label)
                            raise error from None
                        # Serialize and validate JSON values.
                        if isinstance(
                                domain, htsql_rex_deploy.domain.JSONDomain):
                            try:
                                data = json.dumps(
                                        data, indent=2, separators=(',', ': '),
                                        sort_keys=True)
                            except TypeError as exc:
                                error = Error(
                                        "Discovered invalid JSON input:", exc)
                                error.wrap(
                                        "While converting field:", field.label)
                                raise error from None
                        # If the value is a TZ-aware datetime, we convert
                        # it to the local timezone and then strip the
                        # timezone.  This is compatible with PostgreSQL
                        # TIMESTAMP parsing rules and allows us to compare
                        # datetime values in Python code.
                        if (isinstance(data, datetime.datetime) and
                            data.tzinfo is not None):
                            tz = psycopg2.tz.LocalTimezone()
                            data = data.astimezone(tz).replace(tzinfo=None)
                if field in required and (data is None or data is SKIP):
                    raise Error("Discovered missing value for identity field:",
                                field.label)
                record.append(data)
            yield tuple(record)

    @classmethod
    def _domain(cls, field):
        # Determines HTSQL domain of the column.

        # FK column -> identity of the target table.
        if field.is_link:
            target = field.target_table
            labels = [cls._domain(identity_field)
                      for identity_field in target.identity().fields]
            return htsql.core.domain.IdentityDomain(labels)
        # Type image.
        type = field.image.type
        # Unwrap a domain type.
        while type.is_domain:
            type = type.base_type
        # Translate a `ENUM` type.
        if type.is_enum:
            labels = type.labels
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
            elif type.name in ['json', 'jsonb']:
                return htsql_rex_deploy.domain.JSONDomain()
        # Fallback to opaque domain.
        return htsql.core.domain.OpaqueDomain()

    @classmethod
    def _adapt(cls, data, domain):
        # Adapts a raw value to the given HTSQL domain.
        if data is None:
            return None
        if isinstance(data, str):
            return domain.parse(data)
        if isinstance(domain, htsql.core.domain.BooleanDomain):
            if isinstance(data, bool):
                return data
        elif isinstance(domain, htsql.core.domain.IntegerDomain):
            if isinstance(data, int):
                return data
        elif isinstance(domain, htsql.core.domain.FloatDomain):
            if isinstance(data, float):
                return data
            elif isinstance(data, (int, decimal.Decimal)):
                return float(data)
        elif isinstance(domain, htsql.core.domain.DecimalDomain):
            if isinstance(data, decimal.Decimal):
                return data
            if isinstance(data, (int, float)):
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
        elif isinstance(domain, htsql_rex_deploy.domain.JSONDomain):
            return data
        raise ValueError(repr(data))

    @classmethod
    def _resolve(cls, table, items):
        # Finds a row by identity.

        # Pre-load table data if necessary.
        cls._fetch(table)

        # Determine the PK value.
        handle = []
        for field, item in zip(table.identity().fields, items):
            if field.is_column:
                handle.append(item)
            else:
                item = cls._resolve(field.target_table, item)
                handle.append(item)
        handle = tuple(handle)
        # Find the row by PK.
        row = table.image.data.get(table.image.primary_key, handle)
        # Return the row ID.
        if row is None:
            return None
        else:
            return row[0]

    @classmethod
    def _fetch(cls, table):
        # Pre-loads table data if necessary.
        driver = table.schema.driver
        if table.image.data is None:
            was_locked = driver.set_lock(False)
            table.image.select()
            driver.set_lock(was_locked)

    @classmethod
    def _invalidate(cls, table):
        # Invalidates table data.
        if table.image.data is not None:
            table.image.data.remove()
            for dependent in table.dependents():
                if dependent.is_link and dependent.target_table is table:
                    cls._invalidate(dependent.table)


