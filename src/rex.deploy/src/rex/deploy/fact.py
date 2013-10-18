#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Extension, MaybeVal, StrVal, BoolVal, OneOfVal,
        ChoiceVal, SeqVal, RecordVal, get_packages, Error, guard)
from .cluster import get_cluster
from .introspect import introspect
from .sql import (mangle, sql_create_table, sql_drop_table, sql_define_column,
        sql_add_column, sql_drop_column, sql_add_unique_constraint,
        sql_add_foreign_key_constraint, sql_drop_constraint,
        sql_create_enum_type, sql_drop_type, sql_select, sql_insert,
        sql_update)
import csv
import htsql.core.domain
import yaml
import psycopg2


class Driver(object):

    def __init__(self, connection):
        self.connection = connection
        self.catalog = None
        self.output = []

    def get_catalog(self):
        if self.catalog is None:
            self.catalog = introspect(self.connection)
        return self.catalog

    def get_schema(self):
        return self.get_catalog()["public"]

    def __call__(self, facts):
        for fact in facts:
            fact(self)

    def submit(self, sql):
        cursor = self.connection.cursor()
        try:
            #print sql
            cursor.execute(sql)
            if cursor.description is not None:
                return cursor.fetchall()
        finally:
            cursor.close()


class Fact(Extension):
    # Represents a state of the database.

    fields = []
    key = None
    validate = None

    @classmethod
    def sanitize(cls):
        if cls.fields:
            if cls.key is None:
                cls.key = cls.fields[0][0]
            if cls.validate is None:
                cls.validate = RecordVal(cls.fields)

    @classmethod
    def enabled(cls):
        return bool(cls.fields)

    def __init__(self, *args, **kwds):
        for field in self.fields:
            name = field[0]
            validate = field[1]
            has_default = (len(field) > 2)
            if has_default:
                default = field[2]
            if args:
                value = validate(args[0])
                args = args[1:]
            elif name in kwds:
                value = validate(kwds.pop(name))
            elif has_default:
                value = default
            else:
                raise TypeError("missing field %s" % name)
            setattr(self, name, value)
        if args:
            raise TypeError("unexpected positional arguments")
        if kwds:
            raise TypeError("unexpected keyword arguments")

    def __call__(self, driver):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)

    def __repr__(self):
        args = []
        for field in self.fields:
            name = field[0]
            value = getattr(self, name)
            if len(field) > 2:
                default = field[2]
                if value is default:
                    continue
            args.append("%s=%r" % (name, value))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class TableFact(Fact):

    fields = [
            ('table', StrVal(r'\w+')),
            ('present', BoolVal(), True),
    ]

    def __call__(self, driver):
        schema = driver.get_schema()
        system_schema = driver.get_catalog()['pg_catalog']
        name = mangle(self.table)
        if self.present:
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


class ColumnFact(Fact):

    fields = [
            ('column', StrVal(r'\w+(?:\.\w+)?')),
            ('of', MaybeVal(StrVal(r'\w+')), None),
            ('type', OneOfVal(ChoiceVal("boolean", "integer", "decimal",
                                        "float", "text", "date", "time",
                                        "datetime"),
                              SeqVal(StrVal()))),
            ('required', BoolVal(), True),
            ('present', BoolVal(),  True),
    ]

    def __init__(self, *args, **kwds):
        super(ColumnFact, self).__init__(*args, **kwds)
        if '.' in self.column:
            self.of, self.column = self.column.split('.')

    def __call__(self, driver):
        schema = driver.get_schema()
        system_schema = driver.get_catalog()['pg_catalog']
        table_name = mangle(self.of)
        name = mangle(self.column)
        if self.present:
            if table_name not in schema:
                raise Error("Unknown table:", self.of)
            table = schema[table_name]
            if name in table:
                return
            is_enum = isinstance(self.type, list)
            if is_enum:
                type_name = mangle([self.of, self.column], "enum")
                type = schema.add_enum_type(type_name, self.type)
                sql = sql_create_enum_type(type.name, type.labels)
                driver.submit(sql)
            else:
                type_mapping = {
                        "boolean": "bool",
                        "integer": "int4",
                        "decimal": "numeric",
                        "float": "float8",
                        "text": "text",
                        "date": "date",
                        "time": "time",
                        "datetime": "timestamp",
                }
                type = system_schema.types[type_mapping[self.type]]
            column = table.add_column(name, type, self.required)
            sql = sql_add_column(table.name, column.name, column.type.name,
                             self.required)
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
            ('link', StrVal(r'\w+(?:\.\w+)?')),
            ('of', MaybeVal(StrVal(r'\w+')), None),
            ('to', MaybeVal(StrVal(r'\w+')), None),
            ('required', BoolVal(), True),
            ('present', BoolVal(),  True),
    ]

    def __init__(self, *args, **kwds):
        super(LinkFact, self).__init__(*args, **kwds)
        if '.' in self.link:
            self.of, self.link = self.link.split('.')
        if self.to is None:
            self.to = self.link

    def __call__(self, driver):
        schema = driver.get_schema()
        system_schema = driver.get_catalog()['pg_catalog']
        table_name = mangle(self.of)
        name = mangle(self.link, u"id")
        target_table_name = mangle(self.to)
        constraint_name = mangle([self.of, self.link], "fk")
        if self.present:
            if table_name not in schema:
                raise Error("Unknown table:", self.of)
            if target_table_name not in schema:
                raise Error("Unknown target table:", self.to)
            table = schema[table_name]
            if name in table:
                return
            type = system_schema.types["int4"]
            column = table.add_column(name, type, self.required)
            target_table = schema[target_table_name]
            if u"id" not in target_table:
                raise Error("Missing ID column from target table:", self.to)
            target_column = target_table[u"id"]
            key = table.add_foreign_key(constraint_name, [column],
                                        target_table, [target_column])
            sql = sql_add_column(table.name, column.name, column.type.name,
                             self.required)
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
            ('identity', SeqVal(StrVal(r'\w+(?:\.\w+)?'))),
            ('of', MaybeVal(StrVal(r'\w+')), None),
    ]

    def __init__(self, *args, **kwds):
        super(IdentityFact, self).__init__(*args, **kwds)
        names = []
        for name in self.identity:
            if "." in name:
                self.of, name = name.split(".")
            names.append(name)
        self.identity = names

    def __call__(self, driver):
        schema = driver.get_schema()
        table_name = mangle(self.of)
        constraint_name = mangle(self.of, "pk")
        if table_name not in schema:
            raise Error("Unknown table:", self.of)
        table = schema[self.of]
        columns = []
        for label in self.identity:
            column_name = mangle(label)
            link_name = mangle(label, u"id")
            if column_name in table:
                column = table[column_name]
            elif link_name in table:
                column = table[link_name]
            else:
                raise Error("Unknown field:", "%s.%s" % (self.of, label))
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
            ('of', StrVal(r'\w+')),
    ]

    def __call__(self, driver):
        schema = driver.get_schema()
        table_name = mangle(self.of)
        if table_name not in schema:
            raise Error("Unknown table:", self.of)
        table = schema[self.of]
        if table.primary_key is None:
            raise Error("Table without identity:", self.of)

        if table.data is None:
            sql = sql_select(table.name, [column.name for column in table])
            rows = driver.submit(sql)
            table.add_data(rows)

        reader = csv.reader(self.data.splitlines())
        names = next(reader)
        rows = list(reader)

        columns = []
        mask = []
        targets = {}
        for name in names:
            name = mangle(name)
            if name in table:
                column = table[name]
                if column in columns:
                    raise Error("Duplicate field:", name)
                columns.append(column)
                mask.append(table.columns.index(column.name))
            else:
                name = mangle(name, 'id')
                if name in table:
                    column = table[name]
                    if column in columns:
                        raise Error("Duplicate field:", name)
                    columns.append(column)
                    mask.append(table.columns.index(column.name))
                    assert len(column.foreign_keys) == 1
                    target = column.foreign_keys[0].target
                    targets[column] = target
                else:
                    raise Error("Unknown field:", name)

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


def get_facts():
    facts = []
    fact_types = Fact.all()
    for package in reversed(get_packages()):
        if not package.exists('deploy.yaml'):
            continue
        stream = package.open('deploy.yaml')
        try:
            deploy = yaml.safe_load(stream)
        except yaml.YAMLError, error:
            raise Error("Failed to load a deployment file:", str(error))
        if deploy is None:
            continue
        if not isinstance(deploy, list):
            raise Error("Got ill-formed deployment file:",
                        package.abspath('deploy.yaml'))
        for idx, record in enumerate(deploy):
            with guard("While parsing fact #%s from:" % (idx+1),
                       package.abspath('deploy.yaml')):
                if not isinstance(record, dict):
                    raise Error("Got ill-formed fact")
                for fact_type in fact_types:
                    if fact_type.key in record:
                        record = fact_type.validate(record)
                        fact = fact_type(*record)
                        facts.append(fact)
                        break
                else:
                    raise Error("Got unrecognized fact")
    return facts


def deploy(dry_run=False):
    facts = get_facts()
    cluster = get_cluster()
    connection = cluster.connect()
    try:
        driver = Driver(connection)
        driver(facts)
        if not dry_run:
            connection.commit()
        else:
            connection.rollback()
        connection.close()
    except psycopg2.Error, error:
        raise Error("Got an error from the database driver:", error)


