#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Extension, Validate, MaybeVal, StrVal, BoolVal, OneOfVal,
        ChoiceVal, SeqVal, OneOrSeqVal, MapVal, RecordVal, SwitchVal,
        get_packages, Error, guard, locate, set_location)
from .cluster import get_cluster
from .introspect import introspect
from .sql import (mangle, sql_create_table, sql_drop_table, sql_define_column,
        sql_add_column, sql_drop_column, sql_add_unique_constraint,
        sql_add_foreign_key_constraint, sql_drop_constraint,
        sql_create_enum_type, sql_drop_type, sql_select, sql_insert,
        sql_update)
import csv
import re
import datetime
import os.path
import htsql.core.domain
import psycopg2
import yaml


class FactVal(Validate):

    def _switch(self):
        validate_map = {}
        for fact_type in Fact.all():
            validate_map[fact_type.key] = fact_type.validate
        return SwitchVal(validate_map)

    def __call__(self, data):
        switch_val = self._switch()
        return switch_val(data)

    def construct(self, loader, node):
        switch_val = self._switch()
        return switch_val.construct(loader, node)


class UnicodeVal(StrVal):

    def __init__(self, pattern=None):
        super(UnicodeVal, self).__init__(pattern)

    def __call__(self, data):
        data = super(UnicodeVal, self).__call__(data)
        return data.decode('utf-8')

    def construct(self, loader, node):
        data = super(UnicodeVal, self).construct(loader, node)
        return data.decode('utf-8')


class LabelVal(UnicodeVal):

    def __init__(self):
        super(LabelVal, self).__init__(r'[a-z_][0-9a-z_]*')


class DottedLabelVal(UnicodeVal):

    def __init__(self):
        super(DottedLabelVal, self).__init__(
                r'[a-z_][0-9a-z_]*([.][a-z_][0-9a-z_]*)?')


class Driver(object):

    validate = OneOrSeqVal(FactVal())

    def __init__(self, connection, logging={}):
        self.connection = connection
        self.catalog = None
        self.logging = logging
        self.cwd = None
        self.is_locked = True

    def chdir(self, directory):
        self.cwd = directory

    def lock(self):
        self.is_locked = True

    def unlock(self):
        self.is_locked = False

    def reset(self):
        self.catalog = None
        self.is_locked = True

    def parse(self, stream):
        spec = self.validate.parse(stream)
        if isinstance(spec, list):
            facts = []
            for item in spec:
                with guard("While parsing:", locate(item)):
                    facts.append(self.build(item))
            return facts
        else:
            with guard("While parsing:", locate(spec)):
                return self.build(spec)

    def build(self, spec):
        for fact_type in Fact.all():
            if isinstance(spec, fact_type.record_type):
                fact = fact_type.build(self, spec)
                set_location(spec, fact)
                return fact
        assert False, "unknown fact record: %s" % spec

    def log(self, msg, *args, **kwds):
        log = self.logging.get('log')
        if log is not None:
            log(msg, *args, **kwds)

    def warn(self, msg, *args, **kwds):
        warn = self.logging.get('warn')
        if warn is not None:
            warn(msg, *args, **kwds)

    def debug(self, msg, *args, **kwds):
        debug = self.logging.get('debug')
        if debug is not None:
            debug(msg, *args, **kwds)

    def get_catalog(self):
        if self.catalog is None:
            self.catalog = introspect(self.connection)
        return self.catalog

    def get_schema(self):
        return self.get_catalog()[u"public"]

    def __call__(self, fact):
        try:
            return fact(self)
        except Error, error:
            location = locate(fact) or fact
            error.wrap("While deploying:", location)
            raise

    def submit(self, sql):
        cursor = self.connection.cursor()
        try:
            self.debug(sql)
            cursor.execute(sql)
            if cursor.description is not None:
                return cursor.fetchall()
        finally:
            cursor.close()


class Fact(Extension):
    """Represents a state of the database."""

    fields = []
    key = None
    validate = None
    record_type = None

    @classmethod
    def sanitize(cls):
        if cls.__dict__.get('fields'):
            if 'key' not in cls.__dict__:
                cls.key = cls.fields[0][0]
            if 'validate' not in cls.__dict__:
                cls.validate = RecordVal(cls.fields)
            if 'record_type' not in cls.__dict__:
                cls.record_type = cls.validate.record_type

    @classmethod
    def enabled(cls):
        return bool(cls.fields)

    def __call__(self, driver):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __unicode__(self):
        return yaml.dump(self, Dumper=FactDumper)

    def __repr__(self):
        raise NotImplementedError("%s.__repr__()" % self.__class__.__name__)

    def __yaml__(self):
        raise NotImplementedError("%s.__yaml__()" % self.__class__.__name__)


class FactDumper(yaml.Dumper):

    def represent_str(self, data):
        # Represent both `str` and `unicode` objects as YAML strings.
        # Use block style for multiline strings.
        if isinstance(data, unicode):
            data = data.encode('utf-8')
        tag = None
        style = None
        if data.endswith('\n'):
            style = '|'
        try:
            data = data.decode('utf-8')
            tag = u'tag:yaml.org,2002:str'
        except UnicodeDecodeError:
            data = data.encode('base64')
            tag = u'tag:yaml.org,2002:binary'
            style = '|'
        return self.represent_scalar(tag, data, style=style)

    def represent_fact(self, data):
        # Represent `Fact` objects.
        tag = u'tag:yaml.org,2002:map'
        mapping = list(data.__yaml__())
        flow_style = None
        return self.represent_mapping(tag, mapping, flow_style=flow_style)

FactDumper.add_representer(str, FactDumper.represent_str)
FactDumper.add_representer(unicode, FactDumper.represent_str)
FactDumper.add_multi_representer(Fact, FactDumper.represent_fact)


class TableFact(Fact):

    fields = [
            ('table', LabelVal()),
            ('present', BoolVal(), True),
            ('with', SeqVal(FactVal()), None),
    ]

    @classmethod
    def build(cls, driver, spec):
        label = spec.table
        is_present = spec.present
        if not is_present and spec.with_:
            raise Error("Got unexpected clause:", "with")
        nested_facts = None
        if spec.with_:
            nested_facts = []
            for nested_spec in spec.with_:
                if 'of' not in nested_spec._fields:
                    raise Error("Got unrelated nested fact",
                                locate(nested_spec))
                if nested_spec.of is None:
                    nested_spec = nested_spec.__clone__(of=label)
                if nested_spec.of != label:
                    raise Error("Got unrelated nested fact",
                                locate(nested_spec))
                nested_fact = driver.build(nested_spec)
                nested_facts.append(nested_fact)
        return cls(label, is_present=is_present, nested_facts=nested_facts)

    def __init__(self, label, is_present=True, nested_facts=None):
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (nested_facts is None or
                    (isinstance(nested_facts, list) and
                     all(isinstance(fact, Fact) for fact in nested_facts)))
        else:
            assert nested_facts is None
        self.label = label
        self.is_present = is_present
        self.nested_facts = nested_facts

    def __yaml__(self):
        yield ('table', self.label)
        if not self.is_present:
            yield ('present', self.is_present)
        if self.nested_facts is not None:
            yield ('with', self.nested_facts)

    def __repr__(self):
        args = []
        args.append(repr(self.label))
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        if self.nested_facts is not None:
            args.append("nested_facts=%r" % self.nested_facts)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        schema = driver.get_schema()
        system_schema = driver.get_catalog()['pg_catalog']
        name = mangle(self.label)
        if self.is_present:
            if name in schema:
                return
            table = schema.add_table(name)
            type = system_schema.types["int4"]
            column = table.add_column(u"id", type, True)
            constraint_name = mangle([table.name, column.name], "uk")
            key = table.add_unique_key(constraint_name, [column])
            body = [sql_define_column(column.name, "serial4", True)]
            sql = sql_create_table(name, body)
            driver.submit(sql)
            sql = sql_add_unique_constraint(table.name, key.name,
                                        [column.name], False)
            driver.submit(sql)
        else:
            if name not in schema:
                return
            table = schema[name]
            sql = sql_drop_table(table.name)
            driver.submit(sql)
            table.remove()
        if self.nested_facts:
            for nested_fact in self.nested_facts:
                nested_fact(driver)


class ColumnFact(Fact):

    TYPE_MAP = {
            "boolean": "bool",
            "integer": "int4",
            "decimal": "numeric",
            "float": "float8",
            "text": "text",
            "date": "date",
            "time": "time",
            "datetime": "timestamp",
    }

    fields = [
            ('column', DottedLabelVal()),
            ('of', LabelVal(), None),
            ('type', OneOfVal(ChoiceVal(*sorted(TYPE_MAP)),
                              SeqVal(UnicodeVal(r'[0-9A-Za-z_-]+'))), None),
            ('required', BoolVal(), None),
            ('present', BoolVal(), True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if u'.' in spec.column:
            table_label, label = spec.column.split(u'.')
            if spec.of is not None and spec.of != table_label:
                raise Error("Got mismatched table names:",
                            ", ".join((table_label, spec.of)))
        else:
            label = spec.column
            table_label = spec.of
            if spec.of is None:
                raise Error("Got missing table name")
        is_present = spec.present
        type = spec.type
        if is_present:
            if type is None:
                raise Error("Got missing clause:", "type")
            if isinstance(type, list):
                if len(type) == 0:
                    raise Error("Got missing enum labels")
                if len(set(type)) < len(type):
                    raise Error("Got duplicate enum labels:",
                                ", ".join(type))
        else:
            if type is not None:
                raise Error("Got unexpected clause:", "type")
        is_required = spec.required
        if is_present:
            if is_required is None:
                is_required = True
        else:
            if is_required is not None:
                raise Error("Got unexpected clause:", "required")
        return cls(table_label, label, type=type, is_required=is_required,
                   is_present=is_present)

    def __init__(self, table_label, label, type=None, is_required=None,
                 is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(type, str) and type in self.TYPE_MAP or
                    isinstance(type, list) and len(type) > 0 and
                    all(isinstance(label, unicode) and len(label) > 0
                        for label in type) and
                    len(set(type)) == len(type))
            assert isinstance(is_required, bool)
        else:
            assert type is None
            assert is_required is None
        self.table_label = table_label
        self.label = label
        self.type = type
        self.is_required = is_required
        self.is_present = is_present

    def __yaml__(self):
        yield ('column', self.label)
        yield ('of', self.table_label)
        if self.type is not None:
            yield ('type', self.type)
        if self.is_required is not None:
            yield ('required', self.is_required)
        if not self.is_present:
            yield ('present', self.is_present)

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        if self.type is not None:
            args.append(repr(self.type))
        if self.is_required is not None:
            args.append("is_required=%r" % self.is_required)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        schema = driver.get_schema()
        system_schema = driver.get_catalog()['pg_catalog']
        table_name = mangle(self.table_label)
        name = mangle(self.label)
        if self.is_present:
            if table_name not in schema:
                raise Error("Unknown table:", self.table_label)
            table = schema[table_name]
            if name in table:
                return
            is_enum = isinstance(self.type, list)
            if is_enum:
                type_name = mangle([self.table_label, self.label], "enum")
                type = schema.add_enum_type(type_name, self.type)
                sql = sql_create_enum_type(type.name, type.labels)
                driver.submit(sql)
            else:
                type = system_schema.types[self.TYPE_MAP[self.type]]
            column = table.add_column(name, type, self.is_required)
            sql = sql_add_column(table.name, column.name, column.type.name,
                                 self.is_required)
            driver.submit(sql)
        else:
            if table_name not in schema:
                return
            table = schema[table_name]
            if name not in table:
                return
            column = table[name]
            sql = sql_drop_column(table.name, column.name)
            driver.submit(sql)
            column.remove()


class LinkFact(Fact):

    fields = [
            ('link', DottedLabelVal()),
            ('of', LabelVal(), None),
            ('to', LabelVal(), None),
            ('required', BoolVal(), True),
            ('present', BoolVal(), True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if u'.' in spec.link:
            table_label, label = spec.link.split(u'.')
            if spec.of is not None and spec.of != table_label:
                raise Error("Got mismatched table names:",
                            ", ".join((table_label, spec.of)))
        else:
            label = spec.link
            table_label = spec.of
            if spec.of is None:
                raise Error("Got missing table name")
        target_table_label  = spec.to
        if target_table_label is None:
            target_table_label = label
        is_present = spec.present
        is_required = spec.required
        if is_present:
            if is_required is None:
                is_required = True
        else:
            if is_required is not None:
                raise Error("Got unexpected clause:", "required")
        return cls(table_label, label, target_table_label,
                   is_required=is_required, is_present=is_present)

    def __init__(self, table_label, label, target_table_label,
                 is_required=None, is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert isinstance(label, unicode) and len(label) > 0
        assert (isinstance(target_table_label, unicode)
                and len(target_table_label) > 0)
        assert isinstance(is_present, bool)
        if is_present:
            assert isinstance(is_required, bool)
        else:
            assert is_required is None
        self.table_label = table_label
        self.label = label
        self.target_table_label = target_table_label
        self.type = type
        self.is_required = is_required
        self.is_present = is_present

    def __yaml__(self):
        yield ('link', self.label)
        yield ('of', self.table_label)
        yield ('to', self.target_table_label)
        if self.is_required is not None:
            yield ('required', self.is_required)
        if not self.is_present:
            yield ('present', self.is_present)

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        args.append(repr(self.target_table_label))
        if self.is_required is not None:
            args.append("is_required=%r" % self.is_required)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        schema = driver.get_schema()
        system_schema = driver.get_catalog()['pg_catalog']
        table_name = mangle(self.table_label)
        name = mangle(self.label, u"id")
        target_table_name = mangle(self.target_table_label)
        constraint_name = mangle([self.table_label, self.label], "fk")
        if self.is_present:
            if table_name not in schema:
                raise Error("Unknown table:", self.table_label)
            if target_table_name not in schema:
                raise Error("Unknown target table:", self.target_table_label)
            table = schema[table_name]
            if name in table:
                return
            type = system_schema.types["int4"]
            column = table.add_column(name, type, self.is_required)
            target_table = schema[target_table_name]
            if u"id" not in target_table:
                raise Error("Missing ID column from target table:",
                            self.target_table_label)
            target_column = target_table[u"id"]
            key = table.add_foreign_key(constraint_name, [column],
                                        target_table, [target_column])
            sql = sql_add_column(table.name, column.name, column.type.name,
                                 self.is_required)
            driver.submit(sql)
            sql = sql_add_foreign_key_constraint(table.name, key.name,
                                             [column.name], target_table.name,
                                             [target_column.name])
            driver.submit(sql)
        else:
            if table_name not in schema:
                return
            table = schema[table_name]
            if name not in table:
                return
            column = table[name]
            sql = sql_drop_column(table.name, column.name)
            driver.submit(sql)
            column.remove()


class IdentityFact(Fact):

    fields = [
            ('identity', SeqVal(DottedLabelVal())),
            ('of', LabelVal(), None),
    ]

    @classmethod
    def build(cls, driver, spec):
        table_label = spec.of
        labels = []
        if not spec.identity:
            raise Error("Got missing identity fields")
        for label in spec.identity:
            if u'.' in label:
                current_table_label = table_label
                table_label, label = label.split(u'.')
                if (current_table_label is not None and
                        table_label != current_table_label):
                    raise Error("Got mismatched table names:",
                                ", ".join((table_label, current_table_label)))
            labels.append(label)
        if table_label is None:
            raise Error("Got missing table name")
        return cls(table_label, labels)

    def __init__(self, table_label, labels):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert (isinstance(labels, list) and len(labels) > 0 and
                all(isinstance(label, unicode) for label in labels) and
                len(set(labels)) == len(labels))
        self.table_label = table_label
        self.labels = labels

    def __yaml__(self):
        yield ('identity', self.labels)
        yield ('of', self.table_label)

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.labels))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        schema = driver.get_schema()
        table_name = mangle(self.table_label)
        constraint_name = mangle(self.table_label, "pk")
        if table_name not in schema:
            raise Error("Unknown table:", self.table_label)
        table = schema[table_name]
        columns = []
        for label in self.labels:
            column_name = mangle(label)
            link_name = mangle(label, u"id")
            if column_name in table:
                column = table[column_name]
            elif link_name in table:
                column = table[link_name]
            else:
                raise Error("Unknown field:",
                            "%s.%s" % (self.table_label, label))
            columns.append(column)
        if table.primary_key is not None:
            if table.primary_key.origin_columns == columns:
                return
            sql = sql_drop_constraint(table.name, table.primary_key.name)
            driver.submit(sql)
            table.primary_key.remove()
        key = table.add_primary_key(constraint_name, columns)
        sql = sql_add_unique_constraint(table.name, key.name,
                                    [column.name for column in columns], True)
        driver.submit(sql)


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
        if u'\n' in spec.data:
            data = spec.data
        else:
            data_path = spec.data
            if driver.cwd is not None:
                data_path = os.path.join(driver.cwd, data_path)
            if table_label is None:
                table_label = os.path.splitext(os.path.basename(data_path))[0]
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
                (isinstance(data, str) and len(data) > 0))
        assert (data_path is None) != (data is None)
        assert isinstance(is_present, bool)
        self.table_label = table_label
        self.data_path = data_path
        self.data = data
        self.is_present = is_present

    def __yaml__(self):
        yield ('data', self.data_path or self.data)
        yield ('of', self.table_label)
        if not self.is_present:
            yield ('present', self.is_present)

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
        schema = driver.get_schema()
        table_name = mangle(self.table_label)
        if table_name not in schema:
            raise Error("Unknown table:", self.table_label)
        table = schema[table_name]
        if table.primary_key is None:
            raise Error("Table without identity:", self.table_label)

        if table.data is None:
            sql = sql_select(table.name, [column.name for column in table])
            rows = driver.submit(sql)
            table.add_data(rows)

        if self.data_path is not None:
            reader = csv.reader(open(self.data_path))
        else:
            reader = csv.reader(self.data.splitlines())
        labels = next(reader)
        rows = list(reader)

        columns = []
        mask = []
        targets = {}
        for label in labels:
            name = mangle(label)
            if name in table:
                column = table[name]
                if column in columns:
                    raise Error("Duplicate field:", label)
                columns.append(column)
                mask.append(table.columns.index(column.name))
            else:
                name = mangle(label, 'id')
                if name in table:
                    column = table[name]
                    if column in columns:
                        raise Error("Duplicate field:", label)
                    columns.append(column)
                    mask.append(table.columns.index(column.name))
                    assert len(column.foreign_keys) == 1
                    target = column.foreign_keys[0].target
                    targets[column] = target
                else:
                    raise Error("Unknown field:", label)

        key_mask = []
        for column in table.primary_key:
            if column not in columns:
                raise Error("Missing identity column:", column.name)
            key_mask.append(columns.index(column))

        parsers = []
        for column in columns:
            parsers.append(self._column_domain(column).parse)

        raw_rows = rows
        rows = []
        for raw_row in raw_rows:
            row = []
            for text, parser in zip(raw_row, parsers):
                if not text:
                    data = None
                else:
                    try:
                        data = parser(text.decode('utf-8'))
                    except ValueError, exc:
                        raise Error(str(exc))
                row.append(data)
            rows.append(tuple(row))

        for partial in rows:
            if targets:
                old_partial = partial
                partial = []
                for item, column in zip(old_partial, columns):
                    if column not in targets or item is None:
                        partial.append(item)
                    else:
                        target = targets[column]
                        partial.append(self._resolve(target, item))
                partial = tuple(partial)
            handle = tuple(partial[idx] for idx in key_mask)
            old_row = table.data.get(table.primary_key, handle)
            if old_row is None:
                sql = sql_insert(table.name, [column.name for column in columns],
                             partial, [column.name for column in table.columns])
                output = driver.submit(sql)
                assert len(output) == 1
                table.data.insert(output[0])
            else:
                old_partial = tuple(old_row[idx] for idx in mask)
                if old_partial != partial:
                    sql_updated_names = []
                    sql_updated_values = []
                    for column, old_data, data in zip(columns,
                                                      old_partial, partial):
                        if old_data != data:
                            sql_updated_names.append(column.name)
                            sql_updated_values.append(data)
                    sql = sql_update(table.name,
                                 tuple(columns[idx].name for idx in key_mask),
                                 handle,
                                 sql_updated_names, updated_values,
                                 [column.name for column in table.columns])
                    output = driver.submit(sql)
                    assert len(output) == 1
                    table.data.update(old_row, output[0])

    def _column_domain(self, column):
        if column.foreign_keys:
            target = column.foreign_keys[0].target
            labels = [self._column_domain(column)
                      for column in target.primary_key]
            return htsql.core.domain.IdentityDomain(labels)
        type = column.type
        while type.is_domain:
            type = type.base_type
        if type.is_enum:
            labels = [label.decode('utf-8') for label in type.labels]
            return htsql.core.domain.EnumDomain(labels)
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
            else:
                return htsql.core.domain.OpaqueDomain()
        else:
            return htsql.core.domain.OpaqueDomain()

    def _resolve(self, table, identity):
        if table.data is None:
            sql = sql_select(table.name, [column.name for column in table])
            rows = driver.submit(sql)
            table.add_data(rows)
        handle = []
        for item, column in zip(identity, table.primary_key):
            if not column.foreign_keys:
                handle.append(item)
            else:
                target = column.foreign_keys[0].target
                item = self._resolve(target, item)
                handle.append(item)
        handle = tuple(handle)
        row = table.data.get(table.primary_key, handle)
        if row is None:
            raise Error("Cannot find record:",
                        "%s[%s]" % (table.name, identity))
        return row[0]


def deploy(logging={}, dry_run=False):
    time_start = datetime.datetime.now()
    # Prepare the driver.
    cluster = get_cluster()
    connection = cluster.connect()
    driver = Driver(connection, logging=logging)
    packages = [package for package in reversed(get_packages())
                        if package.exists('deploy.yaml')]
    if not packages:
        driver.log("Nothing to deploy.")
    facts_by_package = {}
    # Load and parse `deploy.yaml` files.
    for package in packages:
        driver.chdir(package.abspath('/'))
        package_facts = driver.parse(package.open('deploy.yaml'))
        if not isinstance(package_facts, list):
            package_facts = [package_facts]
        facts_by_package[package] = package_facts
    driver.chdir(None)
    # Deploying database schema.
    driver.unlock()
    for package in packages:
        driver.log("Deploying {}.", package.name)
        facts = facts_by_package[package]
        for fact in facts:
            driver(fact)
#    # Validating directives.
#    driver.reset()
#    for package in packages:
#        driver.log("Validating {}.", package.name)
#        facts = facts_by_package[package]
#        for fact in facts:
#            if not driver(fact):
#                location = driver.locate(fact) or "--"
#                driver.warn("Fact `{}` ({}) is not satisfied.", fact, location)
    # Commit changes and report.
    if not dry_run:
        connection.commit()
    else:
        driver.log("Rolling back changes (dry run).")
        connection.rollback()
    time_end = datetime.datetime.now()
    driver.debug("Total time: {}", time_end-time_start)


