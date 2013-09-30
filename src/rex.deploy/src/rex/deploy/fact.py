#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Extension, MaybeVal, StrVal, BoolVal, OneOfVal,
        ChoiceVal, SeqVal, RecordVal, get_packages, Error, guard)
from .introspect import introspect
from .write import (mangle, create_table, drop_table, define_column,
        add_column, drop_column, add_unique_constraint,
        add_foreign_key_constraint, drop_constraint,
        create_enum_type, drop_type)
import yaml


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
        cursor = self.connection.cursor()
        for sql in self.output:
            print sql
            cursor.execute(sql)

    def submit(self, sql):
        self.output.append(sql)


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
            column = table.add_column("id", type, False)
            constraint_name = mangle([table.name, column.name], "uk")
            key = table.add_unique_key(constraint_name, [column])
            body = [define_column(column.name, "serial4", False)]
            sql = create_table(name, body)
            driver.submit(sql)
            sql = add_unique_constraint(table.name, key.name,
                                        [column.name], False)
            driver.submit(sql)
        else:
            if name not in schema:
                return
            table = schema[name]
            sql = drop_table(table.name)
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
                sql = create_enum_type(type.name, type.labels)
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
            column = table.add_column(name, type, True)
            sql = add_column(table.name, column.name, column.type.name,
                             (not self.required))
            driver.submit(sql)
        else:
            if table_name not in schema:
                return
            table = schema[table_name]
            if name not in table:
                return
            column = table[name]
            sql = drop_column(table.name, column.name)
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
        name = mangle(self.link, "id")
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
            column = table.add_column(name, type, (not self.required))
            target_table = schema[target_table_name]
            if "id" not in target_table:
                raise Error("Missing ID column from target table:", self.to)
            target_column = target_table["id"]
            key = table.add_foreign_key(constraint_name, [column],
                                        target_table, [target_column])
            sql = add_column(table.name, column.name, column.type.name,
                             (not self.required))
            driver.submit(sql)
            sql = add_foreign_key_constraint(table.name, key.name,
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
            sql = drop_column(table.name, column.name)
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
            link_name = mangle(label, "id")
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
            sql = drop_constraint(table.name, table.primary_key.name)
            driver.submit(sql)
            table.primary_key.remove()
        key = table.add_primary_key(constraint_name, columns)
        sql = add_unique_constraint(table.name, key.name,
                                    [column.name for column in columns], True)
        driver.submit(sql)


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


